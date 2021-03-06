# -*- coding: utf-8 -*-
import os.path as op
import sys
import os
import inspect as ins
import unittest as ut
import shutil as shu
import errno as er

ENVIRON = os.environ
ORIG_ENVIRON = dict(ENVIRON)
TEST_PARAM_NAME = 'TEST_SETPARAMS_PY__PARAM'

SCRIPTDIR = op.dirname(__file__)
MODNAME = 'setparams'
DUMMYMOD = 'dummy'

SCRATCHDIR = op.join(SCRIPTDIR, 'scratch', MODNAME)

def run():
    import test.test_support as ts

    sys.path.insert(0, op.join(SCRIPTDIR, 'src'))
    sys.path.insert(0, SCRATCHDIR)

    try:
        try:
            os.makedirs(SCRATCHDIR)
        except OSError, e:
            if e.errno != er.EEXIST: raise

        with open(op.join(SCRATCHDIR, DUMMYMOD + '.py'), 'w') as out:
            print >> out, """
GLOBS_BEFORE = dict(globals())
import %s as themod
themod.setparams(dict(%s=u'default value'))
GLOBS_AFTER = dict(globals())
        """.lstrip() % (MODNAME, TEST_PARAM_NAME)

        ts.run_unittest(Test_setparams)
    finally:
        sys.path.pop(0)
        sys.path.pop(0)
        try:
            shu.rmtree(SCRATCHDIR)
        except OSError, e:
            if e.errno != er.ENOENT:
                import traceback as tb
                tb.print_exc()


class Test_setparams(ut.TestCase):
    globs = globals()

    def setUp(self):
        ENVIRON[TEST_PARAM_NAME] = 'set through environment'
        sys.modules.pop(MODNAME, None)
        sys.modules.pop(DUMMYMOD, None)
        self.globs.pop(TEST_PARAM_NAME, None)
        self.params = {TEST_PARAM_NAME: u'default value'}

    def tearDown(self):
        ENVIRON.pop(TEST_PARAM_NAME, None)
        sys.modules.pop(MODNAME, None)
        sys.modules.pop(DUMMYMOD, None)

    def test_no_defaults(self):
        self.assertTrue(not TEST_PARAM_NAME in self.globs)

        mod = __import__(MODNAME)
        mod.setparams({})

        self.assertTrue(not TEST_PARAM_NAME in self.globs)

    def test_no_environment(self):
        self.assertTrue(not TEST_PARAM_NAME in self.globs)

        ENVIRON.pop(TEST_PARAM_NAME, None)
        mod = __import__(MODNAME)
        mod.setparams(self.params)

        self.assertTrue(TEST_PARAM_NAME in self.globs)
        self.assertEquals(self.globs[TEST_PARAM_NAME],
                          self.params[TEST_PARAM_NAME])

    def test_script_case(self):
        self.assertTrue(not TEST_PARAM_NAME in self.globs)

        mod = __import__(MODNAME)
        mod.setparams(self.params)

        self.assertTrue(TEST_PARAM_NAME in self.globs)
        self.assertEquals(self.globs[TEST_PARAM_NAME],
                          ENVIRON[TEST_PARAM_NAME])

    def test_module_case(self):
        self.assertTrue(ENVIRON.has_key(TEST_PARAM_NAME))

        mod = __import__(DUMMYMOD)

        self.assertTrue(not TEST_PARAM_NAME in mod.GLOBS_BEFORE)

        self.assertTrue(TEST_PARAM_NAME in mod.GLOBS_AFTER)
        self.assertEquals(mod.GLOBS_AFTER[TEST_PARAM_NAME],
                          self.params[TEST_PARAM_NAME])
        self.assertNotEquals(mod.GLOBS_AFTER[TEST_PARAM_NAME],
                             ENVIRON[TEST_PARAM_NAME])


    def test_calling_module(self):
        mod = __import__(MODNAME)
        self.assertEquals(mod.calling_module(-1).__name__, __name__)
        cwd = os.getcwd()
        try:
            os.chdir(SCRATCHDIR)
            calling_module = mod.calling_module(-1)
        finally:
            os.chdir(cwd)
        self.assertEquals(calling_module.__name__, __name__)

if __name__ == '__main__':
    run()
