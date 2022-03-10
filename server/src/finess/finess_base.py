import pandas as pd
from pyproj import Proj, transform, Transformer

#source = 'https://www.data.gouv.fr/fr/datasets/r/16ee2cd3-b9fe-459e-8a57-46e03ba3adbd'
source = 'https://static.data.gouv.fr/resources/finess-extraction-du-fichier-des-etablissements/20200305-105408/etalab-cs1100507-stock-20200304-0416.csv'
# %%
headers = [
    'section',
    'nofinesset',
    'nofinessej',
    'rs',
    'rslongue',
    'complrs',
    'compldistrib',
    'numvoie',
    'typvoie',
    'voie',
    'compvoie',
    'lieuditbp',
    'commune',
    'departement',
    'libdepartement',
    'ligneacheminement',
    'telephone',
    'telecopie',
    'categetab',
    'libcategetab',
    'categagretab',
    'libcategagretab',
    'siret',
    'codeape',
    'codemft',
    'libmft',
    'codesph',
    'libsph',
    'dateouv',
    'dateautor',
    'maj',
    'numuai'
]

geoloc_names = [
    'nofinesset',
    'coordxet',
    'coordyet',
    'sourcecoordet',
    'datemaj'
]

# %%
# charge le csv avec les bons noms de colonne

df = pd.read_csv(source, sep=';', encoding="Windows-1252", skiprows=1, header=None, names=headers, low_memory=False)
df.drop(columns=['section'], inplace=True)
df.head()

# %%
# Découpe le tableau en deux car les géolocalisations sont à la fin du tableau 🙃

geoloc = df.iloc[int(len(df)/2) :]
geoloc.drop(columns=geoloc.columns[5:], inplace=True)
geoloc.rename(columns=lambda x: geoloc_names[list(df.columns).index(x)], inplace=True)
geoloc.head()

# %%
df = df.iloc[:int(len(df)/2)]

# %%
# Recolle les morceaux
df['nofinesset'] = df['nofinesset'].astype(str)
df.shape

geoloc['nofinesset'] = geoloc['nofinesset'].astype(str)
geoloc.shape


final = df.merge(geoloc, on='nofinesset', how='left')
final.head()

# final.shape
# %%
# Remove if its not a pharmacie and useless columns
copy_final = final.copy()

indexes_to_drop = copy_final.loc[final["categetab"] != 620].index.tolist()

indexes_to_keep = set(range(copy_final.shape[0])) - set(indexes_to_drop)
copy_final = copy_final.take(list(indexes_to_keep))

copy_final = copy_final[[
    "rs",
    "rslongue",
    "numvoie",
    "typvoie",
    "voie",
    "compvoie",
    "lieuditbp",
    "commune",
    "departement",
    "libdepartement",
    "telephone",
    "coordxet",
    "coordyet"]]

copy_final.reset_index(drop=True, inplace= True)
# %%
# Transform coordinates from "Lambert 93" to "WGS84"

for i in range(0, len(copy_final)):
#    print(i)
    points = [(float(copy_final.at[i, "coordxet"]), float(copy_final.at[i, "coordyet"]))]
    transformer = Transformer.from_crs(2154, 4326, always_xy=True)
    for pt in transformer.itransform(points): 
        copy_final.at[i, "coordxet"] = pt[0]
        copy_final.at[i, "coordyet"] = pt[1]
        
copy_final = copy_final.transpose()

# %%
# sauvegarde en utf-8
copy_final.to_json('finess_base.json')
#final.to_csv('finess-clean.csv', encoding='utf-8', sep=';')