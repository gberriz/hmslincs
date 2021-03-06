# the output of this module is the postgres sql that will create the full text indexes
import sys
import init_utils as iu

from db.models import Cell, DataSet, SmallMolecule, Library, Protein, FieldInformation
from django.db import models

# ---------------------------------------------------------------------------

import setparams as _sg
_params = dict(
    VERBOSE = False,
    APPNAME = 'db',
)
_sg.setparams(_params)
del _sg, _params

# ---------------------------------------------------------------------------

def main():
    print '/** creating index definitions for Cell **/'
    createTableIndex('db_cell', Cell)
    print '/** creating index definitions for Small Molecule **/'
    createTableIndex('db_smallmolecule', SmallMolecule)
    print '/** creating index definitions for DataSet **/'
    createTableIndex('db_dataset', DataSet)
    print '/** creating index definitions for Library **/'
    createTableIndex('db_library', Library)
    print '/** creating index definitions for Protein **/'
    createTableIndex('db_protein', Protein)
    print "\n"

def createTableIndex(tableName, model):
    #print 'alter table ', tableName, ' drop column search_vector;'
    print 'alter table ', tableName, ' add column search_vector tsvector;' 
    #print 'drop trigger tsvectorupdate on ', tableName, ';'   
    createTableIndexTrigger(tableName, model)
    createTableIndexUpdate(tableName, model)
    print 'create index ', tableName +'_index on ', tableName, ' using gin(search_vector);'
    print "\n"
    
def createTableIndexTrigger(tableName, model):
    print """ create trigger tsvectorupdate 
        BEFORE INSERT OR UPDATE ON """, tableName, """ 
        FOR EACH ROW EXECUTE PROCEDURE 
            tsvector_update_trigger(search_vector, 'pg_catalog.english', 
            """, ','.join(map(lambda x: x.field,getTextTypeFields(model))) , ");"

def createTableIndexUpdate(tableName, model):
    print 'update ' + tableName + \
        " set search_vector = to_tsvector('pg_catalog.english'," + \
        " || ' ' || ".join(map( lambda x: "coalesce("+x.field+",'') ", getTextTypeFields(model))), ");" 

    
    
def getTextTypeFields(model):
    # Only text or char fields considered, must add numeric fields manually
    #return filter(lambda x: isinstance(x, models.CharField) or isinstance(x, models.TextField), tuple(model._meta.fields))
    return FieldInformation.manager.get_search_fields(model)

if __name__ == "__main__":
    main()
