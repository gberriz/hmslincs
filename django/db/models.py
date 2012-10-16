from django.db import models
from django.core.exceptions import ObjectDoesNotExist,MultipleObjectsReturned

import re
import logging
logger = logging.getLogger(__name__)

# *temporary* shorthand, to make the following declarations more visually
# digestible
_CHAR       = models.CharField
_INTEGER    = models.IntegerField
_TEXT       = models.TextField

# the only purpose for the two temporary shorthand definitions
# below is to make clear how we are translating the SQL NULL and
# NOT NULL qualifiers to Django's representation (in fact, for
# both the null and blank keywords, the default value is False, so
# the **_NOTNULLSTR qualifier below is always unnecessary, and all
# the **_NULLOKSTR qualifiers could be replaced with the
# blank=True spec); incidentally, the setting we're using for
# _NULLOKSTR is the one recommended in the Django docs to
# correspond to NULL-qualified string-type fields in SQL schemas
# (e.g. CHAR and TEXT); note that for such _NULLOKSTR-qualified
# fields, Django will automatically translate an absence of data
# as an empty string, and *not* as an SQL NULL value.
_NOTNULLSTR = dict(null=False, blank=False)
_NULLOKSTR  = dict(null=True, blank=False)
# to follow the opposite convention, uncomment the following

# definition
# _NULLOKSTR  = dict(null=False, blank=True)

class FieldsManager(models.Manager):
    
    fieldinformation_map = {}

    # this is how you override a Manager's base QuerySet
    def get_query_set(self):
        return super(FieldsManager, self).get_query_set()
    
    def get_table_fields(self,table):
        """
        return the FieldInformation objects for the table, or None if not defined
        """
        return self.get_query_set().filter(table=table)
    
    def get_column_fieldinformation_by_priority(self,field_or_alias,tables_by_priority):
        """
        searches for the FieldInformation using the tables in the tables_by_priority, in the order given.
        raises an ObjectDoesNotExist exception if not found in any of them.
        :param tables_by_priority: a sequence of table names.  If an empty table name is given, then
        a search through all fields is used.  This search can result in MultipleObjectsReturned exception.
        """
        for i,table in enumerate(tables_by_priority):
            try:
                if(table == ''):
                    return self.get_column_fieldinformation(field_or_alias)
                return self.get_column_fieldinformation(field_or_alias, table)
            except (ObjectDoesNotExist,MultipleObjectsReturned) as e:
                if( i+1 == len(tables_by_priority)): raise e
                
    def get_column_fieldinformation(self,field_or_alias,table_or_queryset=None):
        """
        return the FieldInformation object for the column, or None if not defined
        """
        
        fi = None
        if(table_or_queryset == None):
            try:
                return self.get_query_set().get(alias=field_or_alias); # TODO can use get?
            except (ObjectDoesNotExist,MultipleObjectsReturned) as e:
                logger.debug(str(('No field information for the alias: ',field_or_alias,e)))
            try:
                return self.get_query_set().get(field=field_or_alias); # TODO can use get?
            except (ObjectDoesNotExist,MultipleObjectsReturned) as e:
                logger.info(str(('No field information for the field: ',field_or_alias,e)))
                raise e
        else:
            # if the table or queryset is given, alias should not be needed
            try:
                fi = self.get_query_set().get(queryset=table_or_queryset, field=field_or_alias)
                return fi
            except (ObjectDoesNotExist,MultipleObjectsReturned) as e:
                logger.debug(str(('No field information for the queryset,field: ',table_or_queryset,field_or_alias, e)))
            
            try:
                return self.get_query_set().get(table=table_or_queryset, field=field_or_alias)
            except (ObjectDoesNotExist,MultipleObjectsReturned) as e:
                logger.info(str(('No field information for the table,field: ',table_or_queryset,field_or_alias, e)))
                raise e
        
    #TODO: link this in to the reindex process!
    def get_search_fields(self,model):
        table = model._meta.module_name
        # Only text or char fields considered, must add numeric fields manually
        # fields = filter(lambda x: isinstance(x, models.CharField) or isinstance(x, models.TextField), tuple(model._meta.fields))
        final_fields = []
        for fi in self.get_table_fields(table):
            if(fi.use_for_search_index):  final_fields.append(fi)
        logger.debug(str(('get_search_fields for ',model,'returns',final_fields)))
        return final_fields



# proposed class to capture all of the DWG information - and to map fields to these database tables
class FieldInformation(models.Model):
    manager                 = FieldsManager()
    objects                 = models.Manager() # default manager
    
    table                   = _CHAR(max_length=35, **_NULLOKSTR)
    field                   = _CHAR(max_length=35, **_NULLOKSTR)
    alias                   = _CHAR(max_length=35, **_NULLOKSTR)
    queryset                = _CHAR(max_length=35, **_NULLOKSTR)
    is_lincs_field          = models.BooleanField(default=False, null=False) # Note: default=False are not set at the db level, only at the Db-api level
    use_for_search_index    = models.BooleanField(default=False) # Note: default=False are not set at the db level, only at the Db-api level
    dwg_version             = _CHAR(max_length=35,**_NULLOKSTR)
    unique_id               = _CHAR(max_length=35,null=False,unique=True)
    field_name              = _TEXT(**_NOTNULLSTR) # name for display
    related_to              = _TEXT(**_NULLOKSTR)
    description             = _TEXT(**_NULLOKSTR)
    importance              = _TEXT(**_NULLOKSTR)
    comments                = _TEXT(**_NULLOKSTR)
    ontologies              = _TEXT(**_NULLOKSTR)
    ontology_reference      = _TEXT(**_NULLOKSTR)
    additional_notes        = _TEXT(**_NULLOKSTR)
    class Meta:
        unique_together = (('table', 'field','queryset'),('field','alias'))    
    def __unicode__(self):
        return unicode(str((self.table, self.field, self.unique_id, self.field_name)))

    def get_column_detail(self):
        s = ''
        if(self.unique_id): s += self.unique_id
        if(self.field_name): 
            if(len(s)>0): s += '-'
            s += self.field_name
        else: raise Exception(str(('field has no field_name value:', self)))
        if(self.description):
            if(len(s)>0): s += ':'
            s+= self.description       
        return s
    
    def get_verbose_name(self):
        logger.debug(str(('create a verbose name for:', self)))
        field_name = self.field_name
        field_name = re.sub(r'^[^_]{2}_','',field_name)
        field_name = field_name.replace('_',' ')
        field_name = field_name.strip()
        if(field_name != ''):
            field_name = field_name.capitalize()
            return field_name
        else:
            return self.field

        
class SmallMolecule(models.Model):
    facility_id             = _INTEGER(null=False) # center compound id
    salt_id                 = _INTEGER(null=True)
    lincs_id                = _INTEGER(null=True)
    name                    = _TEXT(**_NOTNULLSTR) 
    alternative_names       = _TEXT(**_NULLOKSTR) 
    #facility_batch_id       = _INTEGER(null=True)
    molfile                 = _TEXT(**_NULLOKSTR)
    pubchem_cid             = _INTEGER(null=True)
    chembl_id               = _INTEGER(null=True)
    chebi_id                = _INTEGER(null=True)
    inchi                   = _TEXT(**_NULLOKSTR)
    inchi_key               = _TEXT(**_NULLOKSTR)
    smiles                  = _TEXT(**_NULLOKSTR)
    software                = _TEXT(**_NULLOKSTR)
    # Following fields not listed for the canonical information in the DWG, but per HMS policy will be - sde4
    molecular_mass          = _CHAR(max_length=35, **_NULLOKSTR)
    molecular_formula       = _TEXT(**_NULLOKSTR)
    # concentration          = _CHAR(max_length=35, **_NULLOKSTR)
    #plate                   = _INTEGER(null=True)
    #row                     = _CHAR(max_length=1, **_NULLOKSTR)
    #column                  = _INTEGER(null=True)
    #well_type               = _CHAR(max_length=35, **_NULLOKSTR)
    is_restricted           = models.BooleanField(default=False) # Note: default=False are not set at the db level, only at the Db-api level

    class Meta:
        unique_together = ('facility_id', 'salt_id')    
    def __unicode__(self):
        return unicode(str((self.facility_id, self.salt_id)))

CONCENTRATION_GL = 'g/L'
CONCENTRATION_MGML = 'mg/mL'
CONCENTRATION_WEIGHT_VOLUME_CHOICES = ((CONCENTRATION_GL,CONCENTRATION_GL),
                                       (CONCENTRATION_MGML,CONCENTRATION_MGML))

class SmallMoleculeBatch(models.Model):
    smallmolecule           = models.ForeignKey('SmallMolecule')
    facility_batch_id       = _INTEGER(null=True)
    provider                = _TEXT(**_NULLOKSTR)
    provider_catalog_id     = _CHAR(max_length=35, **_NULLOKSTR)
    provider_sample_id      = _CHAR(max_length=35, **_NULLOKSTR)
    chemical_synthesis_reference = _TEXT(**_NULLOKSTR)
    purity                  = _TEXT(**_NULLOKSTR)
    purity_method           = _TEXT(**_NULLOKSTR)
    aqueous_solubility      = models.DecimalField(max_digits=4, decimal_places=2, null=True)
    aqueous_solubility_unit = models.CharField(null=True,
                                               max_length=2,
                                      choices=CONCENTRATION_WEIGHT_VOLUME_CHOICES,
                                      default=CONCENTRATION_MGML)
    date_data_received      = models.DateField(null=True,blank=True)
    date_loaded             = models.DateField(null=True,blank=True)
    date_publicly_available = models.DateField(null=True,blank=True)
    ## following fields probably not used with batch, per HMS policy - sde4
    inchi                   = _TEXT(**_NULLOKSTR)
    inchi_key               = _TEXT(**_NULLOKSTR)
    smiles                  = _TEXT(**_NULLOKSTR)
    molecular_mass          = _CHAR(max_length=35, **_NULLOKSTR)
    molecular_formula       = _TEXT(**_NULLOKSTR)

    def __unicode__(self):
        return unicode(str((self.smallmolecule,self.facility_batch_id)))
    class Meta:
        unique_together = ('smallmolecule', 'facility_batch_id',)    


class Cell(models.Model):
    # ----------------------------------------------------------------------------------------------------------------------
    #                                                                          EXAMPLE VALUES:
    # ----------------------------------------------------------------------------------------------------------------------
    facility_id                    = _INTEGER(null=False)
    name                           = _CHAR(max_length=35, unique=True, **_NOTNULLSTR)    # 5637
    cl_id                          = _CHAR(max_length=35, **_NULLOKSTR)     # CLO_0003703
    alternate_name                 = _CHAR(max_length=35, **_NULLOKSTR)     # CaSki
    alternate_id                   = _CHAR(max_length=100, **_NULLOKSTR)    # COSMIC:687452
    center_name                    = _CHAR(max_length=35, **_NOTNULLSTR)    # HMS
    center_specific_id             = _CHAR(max_length=35, **_NOTNULLSTR)    # HMSL50001
    mgh_id                         = _INTEGER(null=True)       # 6
    assay                          = _TEXT(**_NULLOKSTR)                    # Mitchison Mitosis-apoptosis Img; Mitchison 
                                                                               # Prolif-Mitosis Img; Mitchison 2-3 color apo
                                                                               # pt Img
    provider_name                  = _CHAR(max_length=35, **_NOTNULLSTR)    # ATCC
    provider_catalog_id            = _CHAR(max_length=35, **_NOTNULLSTR)    # HTB-9
    batch_id                       = _CHAR(max_length=35, **_NULLOKSTR)     #
    organism                       = _CHAR(max_length=35, **_NOTNULLSTR)    # Homo sapiens
    organ                          = _CHAR(max_length=35, **_NOTNULLSTR)    # urinary bladder
    tissue                         = _CHAR(max_length=35, **_NULLOKSTR)     #
    cell_type                      = _CHAR(max_length=35, **_NULLOKSTR)     # epithelial
    cell_type_detail               = _CHAR(max_length=35, **_NULLOKSTR)     # epithelial immortalized with hTERT
    disease                        = _TEXT(**_NOTNULLSTR)                   # transitional cell carcinoma
    disease_detail                 = _TEXT(**_NULLOKSTR)                    #
    growth_properties              = _TEXT(**_NOTNULLSTR)                   # adherent
    genetic_modification           = _CHAR(max_length=35, **_NULLOKSTR)     # none
    related_projects               = _CHAR(max_length=35, **_NULLOKSTR)     #
    recommended_culture_conditions = _TEXT(**_NULLOKSTR)                    # From MGH/CMT as specified by cell provider:
                                                                               # RPMI 1640 medium with 2 mM L-glutamine adju
                                                                               # sted to contain 1.5 g/L sodium bicarbonate,
                                                                               #  4.5 g/L glucose, 10 mM HEPES, and 1.0 mM s
                                                                               # odium pyruvate, 90%; fetal bovine serum, 10
                                                                               # %. Protocol: Remove medium, and rinse with 
                                                                               # 0.25% trypsin, 0.03% EDTA solution. Remove 
                                                                               # the solution and add an additional 1 to 2 m
                                                                               # l of trypsin-EDTA solution. Allow the flask
                                                                               #  to sit at room temperature (or at 37C) unt
                                                                               # il the cells detach. Add fresh culture medi
                                                                               # um, aspirate and dispense into new culture 
                                                                               # flasks.\012Subcultivation ratio: A subculti
                                                                               # vation ratio of 1:4 to 1:8 is recommended
                                                                               # \012\012
    verification_profile           = _CHAR(max_length=35, **_NULLOKSTR)     #
    verification_reference_profile = _TEXT(**_NULLOKSTR)                    # DNA Profile (STR, source: ATCC):\012Ameloge
                                                                               # nin: X,Y \012CSF1PO: 11 \012D13S317: 11 \01
                                                                               # 2D16S539: 9 \012D5S818: 11,12 \012D7S820: 1
                                                                               # 0,11 \012THO1: 7,9 \012TPOX: 8,9 \012vWA: 1
                                                                               # 6,18
    mutations_reference            = _TEXT(**_NULLOKSTR)                    # http://www.sanger.ac.uk/perl/genetics/CGP/c
                                                                               # ore_line_viewer?action=sample&id=687452
    mutations_explicit             = _TEXT(**_NULLOKSTR)                    # Mutation data source: Sanger, Catalogue Of 
                                                                               # Somatic Mutations In Cancer: Gene: RB1, \012
                                                                               # AA mutation: p.Y325* (Substitution - Nonsen
                                                                               # se), \012CDS mutation: c.975T>A (Substituti
                                                                               # on); \012\012Gene: TP53, \012AA mutation: p
                                                                               # .R280T (Substitution - Missense), \012CDS m
                                                                               # utation: c.839G>C (Substitution)
    organism_gender                = _CHAR(max_length=35, **_NULLOKSTR)     # male
    date_data_received      = models.DateField(null=True,blank=True)
    date_loaded             = models.DateField(null=True,blank=True)
    date_publicly_available = models.DateField(null=True,blank=True)
    is_restricted                     = models.BooleanField()

    # ----------------------------------------------------------------------------------------------------------------------
    def __unicode__(self):
        return unicode(self.facility_id)

class Protein(models.Model):
    name                = _TEXT(**_NOTNULLSTR)
    lincs_id            = _INTEGER(null=False)
    uniprot_id          = _CHAR(max_length=6, **_NULLOKSTR)
    alternate_name      = _TEXT(**_NULLOKSTR)
    alternate_name_2    = _TEXT(**_NULLOKSTR)
    provider            = _TEXT(**_NULLOKSTR)
    provider_catalog_id = _TEXT(**_NULLOKSTR)
    batch_id            = _CHAR(max_length=10, **_NULLOKSTR)
    amino_acid_sequence = _TEXT(**_NULLOKSTR)
    gene_symbol         = _CHAR(max_length=35, **_NULLOKSTR)
    gene_id             = _CHAR(max_length=35, **_NULLOKSTR)
    protein_source      = _CHAR(max_length=35, **_NULLOKSTR)
    protein_form        = _TEXT(**_NULLOKSTR) #TODO: controlled vocabulary
    protein_purity      = _TEXT(**_NULLOKSTR)
    protein_complex     = _TEXT(**_NULLOKSTR)
    isoform             = _CHAR(max_length=5, **_NULLOKSTR) #TODO: Shall this be boolean?
    protein_type        = _CHAR(max_length=35, **_NULLOKSTR) #TODO: controlled vocabulary
    source_organism     = _CHAR(max_length=35, **_NULLOKSTR) #TODO: controlled vocabulary
    reference           = _TEXT(**_NULLOKSTR)
    date_data_received      = models.DateField(null=True,blank=True)
    date_loaded             = models.DateField(null=True,blank=True)
    date_publicly_available = models.DateField(null=True,blank=True)
    is_restricted       = models.BooleanField()

    def __unicode__(self):
        return unicode(self.lincs_id)

class DataSet(models.Model):
    #cells                   = models.ManyToManyField(Cell, verbose_name="Cells screened")
    facility_id             = _INTEGER(null=False)
    title                   = _TEXT(**_NOTNULLSTR)
    lead_screener_firstname = _TEXT(**_NULLOKSTR)
    lead_screener_lastname  = _TEXT(**_NULLOKSTR)
    lead_screener_email     = _TEXT(**_NULLOKSTR)
    lab_head_firstname      = _TEXT(**_NULLOKSTR)
    lab_head_lastname       = _TEXT(**_NULLOKSTR)
    lab_head_email          = _TEXT(**_NULLOKSTR)
    summary                 = _TEXT(**_NOTNULLSTR)
    protocol                = _TEXT(**_NULLOKSTR)
    protocol_references     = _TEXT(**_NULLOKSTR)
    is_restricted           = models.BooleanField()

    def __unicode__(self):
        return unicode(self.facility_id)

class Library(models.Model):
    name                    = _TEXT(unique=True,**_NOTNULLSTR)
    short_name              = _CHAR(max_length=35,unique=True, **_NOTNULLSTR)
    date_first_plated       = models.DateField(null=True,blank=True)
    date_data_received      = models.DateField(null=True,blank=True)
    date_loaded             = models.DateField(null=True,blank=True)
    date_publicly_available = models.DateField(null=True,blank=True)
    is_restricted           = models.BooleanField()

    def __unicode__(self):
        return unicode(self.short_name)
    
CONCENTRATION_NM = 'nM'
CONCENTRATION_UM = 'uM'
CONCENTRATION_MM = 'mM'    
CONCENTRATION_CHOICES = ((CONCENTRATION_NM,CONCENTRATION_NM),
                         (CONCENTRATION_UM,CONCENTRATION_UM),
                         (CONCENTRATION_MM,CONCENTRATION_MM))
class LibraryMapping(models.Model):
    library                 = models.ForeignKey('Library')
    smallmolecule_batch     = models.ForeignKey('SmallMoleculeBatch')
    plate                   = _INTEGER(null=True)
    well                    = _CHAR(max_length=4, **_NULLOKSTR) # AA99
    concentration           = models.DecimalField(max_digits=4, decimal_places=2)
    concentration_unit      = models.CharField(null=True, max_length=2,
                                      choices=CONCENTRATION_CHOICES,
                                      default=CONCENTRATION_UM)
    def __unicode__(self):
        return unicode(str((self.library,self.smallmolecule_batch)))
    class Meta:
        unique_together = ('library', 'smallmolecule_batch',)    
    
class DataColumn(models.Model):
    dataset                 = models.ForeignKey('DataSet')
    worksheet_column        = _TEXT(**_NOTNULLSTR)
    name                    = _TEXT(**_NOTNULLSTR)
    data_type               = _TEXT(**_NOTNULLSTR)
    precision               = _INTEGER(null=True)
    description             = _TEXT(**_NULLOKSTR)
    replicate               = _INTEGER(null=True)
    time_point              = _TEXT(**_NULLOKSTR)
    readout_type            = _TEXT(**_NOTNULLSTR)
    comments                = _TEXT(**_NULLOKSTR)

    def __unicode__(self):
        return unicode(str((self.dataset,self.name,self.data_type)))

class DataRecord(models.Model):
    dataset                 = models.ForeignKey('DataSet')
    smallmolecule_batch     = models.ForeignKey('SmallMoleculeBatch', null=True)
    cell                    = models.ForeignKey('Cell', null=True)
    protein                 = models.ForeignKey('Protein', null=True)
    plate                   = _INTEGER(null=True)
    well                    = _CHAR(max_length=4, **_NULLOKSTR) # AA99
    control_type            = _CHAR(max_length=35, **_NULLOKSTR) # TODO: controlled vocabulary
    def __unicode__(self):
        return unicode(str((self.dataset,self.smallmolecule_batch,self.cell,self.protein,self.plate,self.well)))
    
class DataPoint(models.Model):
    datacolumn              = models.ForeignKey('DataColumn')
    dataset                 = models.ForeignKey('DataSet') # TODO: are we using this? Note, Screen is being included here for convenience
    datarecord              = models.ForeignKey('DataRecord') 
    int_value               = _INTEGER(null=True)
    float_value             = models.FloatField(null=True)
    text_value              = _TEXT(**_NULLOKSTR)
    #omero_well_id           = _CHAR(max_length=35, **_NULLOKSTR) # this is the plate:well id for lookup on the omero system (NOTE:may need multiple of these)
    
    def __unicode__(self):
        return unicode(str((self.datarecord,self.datacolumn,self.int_value,self.float_value,self.text_value)))
    class Meta:
        unique_together = ('datacolumn', 'datarecord',)    




del _CHAR, _TEXT, _INTEGER
del _NULLOKSTR, _NOTNULLSTR

   
