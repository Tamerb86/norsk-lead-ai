import mysql.connector
import os
from datetime import date

# Database connection
db = mysql.connector.connect(
    host=os.environ.get("DB_HOST", ""),
    user=os.environ.get("DB_USER", ""),
    password=os.environ.get("DB_PASS", ""),
    database=os.environ.get("DB_NAME", ""),
    port=int(os.environ.get("DB_PORT", "3306"))
)

cursor = db.cursor()

# Demo Norwegian companies
companies = [
    ("912345678", "Equinor ASA", "ASA", "06.200", "Utvinning av råolje", None, None, 21000, "Forusbeen 50", "Stavanger", "4035", "Stavanger", "Rogaland", "post@equinor.com", "+47 51 99 00 00", "https://www.equinor.com", date(1972, 6, 14), date(1972, 6, 14), False, False, False),
    ("923456789", "DNB Bank ASA", "ASA", "64.190", "Banker", None, None, 9500, "Dronning Eufemias gate 30", "Oslo", "0191", "Oslo", "Oslo", "dnb@dnb.no", "+47 915 04800", "https://www.dnb.no", date(1822, 1, 1), date(1990, 1, 1), False, False, False),
    ("934567890", "Telenor ASA", "ASA", "61.100", "Telekommunikasjon via kabel", None, None, 7000, "Snarøyveien 30", "Fornebu", "1360", "Bærum", "Viken", "info@telenor.com", "+47 915 09000", "https://www.telenor.no", date(1855, 1, 1), date(2000, 12, 1), False, False, False),
    ("945678901", "Norsk Hydro ASA", "ASA", "24.420", "Produksjon av aluminium", None, None, 35000, "Drammensveien 264", "Oslo", "0283", "Oslo", "Oslo", "post@hydro.com", "+47 22 53 81 00", "https://www.hydro.com", date(1905, 12, 2), date(1905, 12, 2), False, False, False),
    ("956789012", "Mowi ASA", "ASA", "03.210", "Havbruk av fisk", None, None, 15000, "Sandviksboder 77 A-B", "Bergen", "5035", "Bergen", "Vestland", "mowi@mowi.com", "+47 55 21 77 00", "https://www.mowi.com", date(1964, 1, 1), date(2014, 1, 1), False, False, False),
    ("967890123", "Schibsted ASA", "ASA", "58.130", "Utgivelse av aviser", None, None, 6500, "Apotekergata 10", "Oslo", "0107", "Oslo", "Oslo", "info@schibsted.com", "+47 24 14 40 00", "https://www.schibsted.com", date(1839, 1, 1), date(1992, 1, 1), False, False, False),
    ("978901234", "Yara International ASA", "ASA", "20.150", "Produksjon av gjødsel", None, None, 17000, "Drammensveien 131", "Oslo", "0277", "Oslo", "Oslo", "post@yara.com", "+47 24 15 70 00", "https://www.yara.com", date(1905, 1, 1), date(2004, 3, 25), False, False, False),
    ("989012345", "Orkla ASA", "ASA", "10.890", "Produksjon av andre næringsmidler", None, None, 18000, "Karenslyst Allé 6", "Oslo", "0278", "Oslo", "Oslo", "post@orkla.com", "+47 22 54 40 00", "https://www.orkla.com", date(1654, 1, 1), date(1985, 1, 1), False, False, False),
    ("990123456", "Aker Solutions ASA", "ASA", "28.920", "Produksjon av maskiner til olje- og gassutvinning", None, None, 11000, "Oksenøyveien 10", "Lysaker", "1366", "Bærum", "Viken", "post@akersolutions.com", "+47 67 51 30 00", "https://www.akersolutions.com", date(1841, 1, 1), date(2014, 7, 1), False, False, False),
    ("901234567", "Storebrand ASA", "ASA", "65.110", "Livsforsikring", None, None, 2200, "Professor Kohts vei 9", "Lysaker", "1366", "Bærum", "Viken", "post@storebrand.no", "+47 22 31 50 50", "https://www.storebrand.no", date(1767, 1, 1), date(1990, 1, 1), False, False, False),
    ("912345679", "Kongsberg Gruppen ASA", "ASA", "30.400", "Produksjon av militære stridsvogner", None, None, 11000, "Kirkegårdsveien 45", "Kongsberg", "3616", "Kongsberg", "Viken", "post@kongsberg.com", "+47 32 28 82 00", "https://www.kongsberg.com", date(1814, 1, 1), date(1987, 1, 1), False, False, False),
    ("923456780", "Tomra Systems ASA", "ASA", "28.290", "Produksjon av andre maskiner til spesiell bruk", None, None, 4500, "Drengsrudhagen 2", "Asker", "1385", "Asker", "Viken", "post@tomra.com", "+47 66 79 91 00", "https://www.tomra.com", date(1972, 1, 1), date(1993, 1, 1), False, False, False),
    ("934567891", "Subsea 7 Norway AS", "AS", "42.910", "Bygging av skip og flytende innretninger", None, None, 3500, "Gravdalsveien 255", "Stavanger", "4024", "Stavanger", "Rogaland", "post@subsea7.com", "+47 51 20 20 00", "https://www.subsea7.com", date(1993, 1, 1), date(2000, 1, 1), False, False, False),
    ("945678902", "Bouvet ASA", "ASA", "62.020", "Konsulentvirksomhet tilknyttet informasjonsteknologi", None, None, 2000, "Sandakerveien 24C", "Oslo", "0473", "Oslo", "Oslo", "post@bouvet.no", "+47 23 40 50 00", "https://www.bouvet.no", date(2002, 1, 1), date(2007, 1, 1), False, False, False),
    ("956789013", "Kahoot! ASA", "ASA", "58.290", "Annen programvarevirksomhet", None, None, 500, "Fridtjof Nansens plass 7", "Oslo", "0160", "Oslo", "Oslo", "post@kahoot.com", "+47 22 00 00 00", "https://www.kahoot.com", date(2012, 1, 1), date(2019, 1, 1), False, False, False),
    ("967890124", "Adevinta ASA", "ASA", "63.120", "Drift av webportaler", None, None, 4000, "Grensen 17-21", "Oslo", "0159", "Oslo", "Oslo", "post@adevinta.com", "+47 22 00 00 00", "https://www.adevinta.com", date(2019, 1, 1), date(2019, 4, 1), False, False, False),
    ("978901235", "Salmar ASA", "ASA", "03.210", "Havbruk av fisk", None, None, 1200, "Industriveien 51", "Kverva", "7600", "Frøya", "Trøndelag", "post@salmar.no", "+47 72 44 35 00", "https://www.salmar.no", date(1991, 1, 1), date(2007, 1, 1), False, False, False),
    ("989012346", "Lerøy Seafood Group ASA", "ASA", "03.210", "Havbruk av fisk", None, None, 5000, "Thormøhlens gate 51B", "Bergen", "5006", "Bergen", "Vestland", "post@lsg.no", "+47 55 21 37 00", "https://www.lsg.no", date(1899, 1, 1), date(2002, 1, 1), False, False, False),
    ("990123457", "Nordic Semiconductor ASA", "ASA", "26.110", "Produksjon av elektroniske kretskort", None, None, 1400, "Otto Nielsens veg 12", "Trondheim", "7052", "Trondheim", "Trøndelag", "post@nordicsemi.no", "+47 72 89 89 00", "https://www.nordicsemi.com", date(1983, 1, 1), date(2001, 1, 1), False, False, False),
    ("901234568", "Atea ASA", "ASA", "46.510", "Engroshandel med datamaskiner", None, None, 7500, "Brynsalléen 4", "Oslo", "0667", "Oslo", "Oslo", "post@atea.com", "+47 22 09 90 00", "https://www.atea.com", date(1968, 1, 1), date(2000, 1, 1), False, False, False),
]

# Insert companies
insert_query = """
INSERT INTO norwegian_companies 
(organisasjonsnummer, navn, organisasjonsform, naeringskode1, naeringsbeskrivelse1, 
 naeringskode2, naeringsbeskrivelse2, antallAnsatte, forretningsadresse, poststed, 
 postnummer, kommune, fylke, epostadresse, telefon, hjemmeside, stiftelsesdato, 
 registreringsdato, konkurs, underAvvikling, underTvangsavviklingEllerTvangsopplosning)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

for company in companies:
    try:
        cursor.execute(insert_query, company)
    except mysql.connector.IntegrityError:
        print(f"Company {company[0]} already exists, skipping...")

db.commit()
print(f"✅ Inserted {len(companies)} demo companies!")

cursor.close()
db.close()
