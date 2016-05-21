import requests 
from bs4 import BeautifulSoup
import json
import re
import csv
from datetime import datetime
import time

# POST url to get all departments teaching courses in a specified quarter
GET_DEPT_URL = "https://act.ucsd.edu/scheduleOfClasses/department-list.json"

# POST url to get the schedule of classes
SoC_URL = "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm"

# All not-class parameters to use in the POST request.
data = {
"loggedIn": "false",
"tabNum": "tabs-dept",
"schedOption1": "true",
"schedOption2": "true",
"schDay": ["M", "T", "W", "R", "F", "S"],
"schStartTime": "12:00",
"schStartAmPm": "0",
"schEndTime": "12:00",
"schEndAmPm": "0",
"schedOption1Dept": "true",
"schedOption2Dept": "true",
"schDayDept": ["M", "T", "W", "R", "F", "S"],
"schStartTimeDept": "12:00",
"schStartAmPmDept": "0",
"schEndTimeDept": "12:00",
"schEndAmPmDept": "0",
"instructorType": "begin",
"titleType": "contain"
}

# Fields grabbed from each course section
SECTION_FIELDS = ["Id", "Type", "Code", "Days", "Time", "Building", "Room", "Professor", "SeatsOpen", "TotalSeats"]

# First nonempty column in table for course entries
SECTION_INIT_COL = 2

# Fields grabbed from each exam section
EXAM_FIELDS = ["Id", "Type", "Date", "Days", "Time", "Building", "Room", "Professor", "SeatsOpen", "TotalSeats"]

# First nonempty column in table for exam entries
EXAM_INIT_COL = 1

def getDepartments(term="SP16"):
    """
    Returns a list of department codes for all departments teaching a class in the chosen term. 
    """
    
    r = requests.get(GET_DEPT_URL, {"selectedTerm" : term})
    depts_dict = json.loads(r.text)
    depts = []
    for dept in depts_dict:
        depts.append(dept["code"])
    return depts

def getSoCPage(departments, pagenumber, term="SP16"):
    """
    Returns HTML for a page in the schedule of classes
    """
    
    args = data
    args["selectedTerm"] = term
    args["selectedDepartments"] = departments
    args["page"] = pagenumber

    
    r = requests.post(SoC_URL, args)
    r.raise_for_status
    return r.text

def stripTag(tag, field):
    """
    Returns the first string within the given HTML tag
    """
    if field == "SeatsOpen":
        out = ""
        for string in tag.stripped_strings:
            out += string + " "
        return out


    for string in tag.stripped_strings:
        return string
    return ""

def getExamOrSection(tr, fieldnames, initCol):
    """
    Returns a dict of exam/section information parsed from the given table row
    """

    section_dict = {}
    fields = tr.find_all("td", class_="brdr")
    
    i = 0
    j = initCol
    while j < len(fields):
        numcols = 1 if fields[j].get("colspan") is None else int(fields[j]["colspan"])
        for k in range(i, min(i + numcols, len(fieldnames))):
            section_dict[fieldnames[k]] = stripTag(fields[j], fieldnames[k])
        i += numcols
        j += 1
    if j == initCol + 1:
        return None

    return section_dict


def parsePage(html, ID, term="SP16"):
    """
    Parses a list of course Dicts extracted from the provided HTML, as well as the
    corresponding sections and exams.
    """

    soup = BeautifulSoup(html, "html.parser")
    course_titles = soup.find_all("td", class_="crsheader", colspan="5")

    epoch = datetime.utcfromtimestamp(0)
    dt = int((datetime.utcnow() - epoch).total_seconds() * 1000.0)
    
    courses = []
    sections = []
    exams = []

    for course in course_titles:
        course_dict = {}

        dept = re.search(r"\((.*)\)", course.find_previous("h2")("span")[0].string).group(1)
        num = course.find_previous_sibling("td", class_="crsheader").string

        course_dict["Title"] = course.find("span", class_="boldtxt").string.strip()
        course_dict["Code"] = dept.strip() + num.strip()
        course_dict["Term"] = term.strip()
        course_dict["ID"] = ID
        courses.append(course_dict)

        tr = course.parent.next_sibling.next_sibling
        while(tr):
            if tr.get("class") is None:
                break

            elif "sectxt" in tr['class']:
                section_dict = getExamOrSection(tr, SECTION_FIELDS, SECTION_INIT_COL)
                if section_dict is None:
                    tr = tr.find_next_sibling("tr")
                    continue
                section_dict["ID"] = ID
                section_dict["datetime"] = dt
                sections.append(section_dict)

            elif "nonenrtxt" in tr['class']:
                exam_dict = getExamOrSection(tr, EXAM_FIELDS, EXAM_INIT_COL)
                # GDI SE department
                if exam_dict is None:
                    tr = tr.find_next_sibling("tr")
                    continue
                if exam_dict["Type"] == "LE":
                    section_dict = getExamOrSection(tr, SECTION_FIELDS, EXAM_INIT_COL)
                    section_dict["ID"] = ID
                    section_dict["datetime"] = dt
                    sections.append(section_dict)
                    tr = tr.find_next_sibling("tr")
                    continue
                exam_dict["ID"] = ID
                exams.append(exam_dict)

            else:
                break

            tr = tr.find_next_sibling("tr")
        ID += 1

    return (courses, sections, exams)

depts = getDepartments("FA16")
page = 1
all_courses = []
all_sections = []
all_exams = []
ID = 0

html = getSoCPage(depts, page, "FA16")
   
while "Exception report" not in html:
    print(page)
    courses, sections, exams = parsePage(html, ID, "FA16")
    ID += len(courses)
    all_courses += courses
    all_sections += sections
    all_exams += exams

    page += 1
    try:
	html = getSoCPage(depts, page, "FA16")
    except Exception:
	break

f = open("courses.csv", "w")
csv_courses = csv.DictWriter(f, fieldnames = ["Title", "Code", "Term", "ID"])
csv_courses.writeheader()
csv_courses.writerows(all_courses)

f = open("sections.csv", "a")
csv_sections = csv.DictWriter(f, fieldnames = SECTION_FIELDS + ["ID", "datetime"])
csv_sections.writeheader()
csv_sections.writerows(all_sections)

f = open("exams.csv", "w")
csv_exams = csv.DictWriter(f, fieldnames = EXAM_FIELDS + ["ID"])
csv_exams.writeheader()
csv_exams.writerows(all_exams)
