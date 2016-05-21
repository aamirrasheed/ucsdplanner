# This function will scrape all the UCSD professors on Rate My Professor and
# get their ratings information.

import requests
from bs4 import BeautifulSoup
import json
from ast import literal_eval

# url to get json with all UCSD professor names and their RMP Id's
ALL_PROFS_URL = 'http://search.mtvnservices.com/typeahead/suggest/?q=*%3A*+AND+schoolid_s%3A1079&defType=edismax&siteName=rmp&rows=2670&start=0'
RATINGS_URL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid='  # url to get prof ratings
COLD_CHILI_PIC = '/assets/chilis/cold-chili.png'    # image name for cold chili pepper
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api/term"

def get_rmp():
    # get all prof info and make it into a dictionary
    r = requests.get(ALL_PROFS_URL)
    info = r.text

    prof_json = json.loads(info)
    dict_profs = literal_eval(json.dumps(prof_json))

    prof_array = dict_profs['response']['docs']
    all_profs = []

    # make a dictionary of prof names and id's
    for prof in prof_array:
        prof_name = prof['teacherfullname_s']
        prof_id = prof['pk_id']
        this_prof = {'name': prof_name, 'id': prof_id}
        all_profs.append(this_prof)


    data = []   # where final data will be stored

    # loop over each professor and get their ratings information
    for prof in all_profs:
        req = requests.get(RATINGS_URL + str(prof['id']))
        soup = BeautifulSoup(req.text, "html.parser")
        header = soup.find("div", "left-breakdown")

        # if header is None, then there are no ratings for prof
        if header == None:
            professor = {}
            professor['name'] = prof['name']
            professor['rmp_overall'] = None
            professor['rmp_helpful'] = None
            professor['rmp_clarity'] = None
            professor['rmp_easiness'] = None
            professor['rmp_hot'] = None
            data.append(professor)
            continue

        overall_rating = soup.find("div", "grade").string
        chili_figure = [grade.figure for grade in soup.findAll("div", "grade")]
        chili_figure = chili_figure[2].img.get('src')

        ratings = soup.findAll("div", "rating")
        helpfulness = ratings[0].string
        clarity = ratings[1].string
        easiness = ratings[2].string

        # dictionary of prof ratings to be put in data
        professor = {}
        professor['name'] = prof['name']
        professor['rmp_overall'] = overall_rating
        professor['rmp_helpful'] = helpfulness
        professor['rmp_clarity'] = clarity
        professor['rmp_easiness'] = easiness
        professor['rmp_hot'] = 1 if chili_figure != COLD_CHILI_PIC else 0
        print professor["name"]
        data.append(professor)


    return data

def post_prof(prof):
    r = requests.post(DB_URL + "professor", prof)
    r.raise_for_status()

get_rmp()
