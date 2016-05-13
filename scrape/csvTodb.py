import csv
import requests
import json
import re

def split_course_name(name):
    match = re.match("([A-Z]*)(.*)", name)
    return " ".join(match.groups())


# TERM stuff
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api" 

term_data = {
    "term_name":"FA16",
    "quarter":"Fall",
    "year":"2016"
}

r = requests.get(DB_URL + "/term", term_data["term_name"])

if r.text == "[]":
    r = requests.post(TERM_API, term_data)
term_id = json.loads(r.text)[0]["id"]

with open("courses.csv", "r") as f_courses, \
     open("sections.csv", "r") as f_sections, \
     open("exams.csv") as f_exams:

    courses = list(csv.DictReader(f_courses))
    sections = list(csv.DictReader(f_sections))
    exams = list(csv.DictReader(f_examss))

    sections_dict = {key:[x for x in sections if x["Id"] == key] for key in range(len(courses))}
    exams_dict = {key:[x for x in exams if x["Id"] == key] for key in range(len(courses))}

    for course in courses:

        course_dict = {}

        course_name = split_course_name(course["Code"])
        r = requests.get(DB_URL + "/catalog/" + course_name)
        
        catalog_course_id = json.loads(r.text)["catalog_id"]

        r = requests,get(DB_URL "/courses/" + catalog_course_id + "/" + term_id)

        course_id = None
        if r.text != "[]":
            course_id = json.loads(r.text)["course_id"]
        else:
            course_dict["term_id"] = term_id
            course_dict["course_name"] = course_name
            course_dict["catalog_course_id"] = catalog_course_id
            r = requests.post(DB_URL + "/courses", course_dict)
            course_id = json.loads(r.text)["course_id"]

        
        

    
