import csv
import requests
import json

# TERM stuff
TERM_API = "https://ucsdplanner-api.azure-mobile.net/api/term/" 
term_data = {
    "term_name":"FA16",
    "quarter":"Fall",
    "year":"2016"
}

r = requests.get(TERM_API + term_data["term_name"])

if r.text == "[]":
    r = requests.post(TERM_API, term_data)
term_id = json.loads(r.text)[0]["id"]

with open("courses.csv", "r") as f_courses, \
     open("sections.csv", "r") as f_sections, \
     open("exams.csv") as f_exams:

    courses = csv.DictReader(f_courses)
    sections = csv.DictReader(f_sections)
    exams = csv.DictReader(f_examss)

    for course in courses:
        `


    
