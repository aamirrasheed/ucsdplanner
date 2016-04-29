import requests 
import urllib.parse as parse
from bs4 import BeautifulSoup
import json
import re

# POST url to get all departments teaching courses in a specified quarter
GET_DEPT_URL = "https://act.ucsd.edu/scheduleOfClasses/department-list.json"

# POST url to get the schedule of classes
SoC_URL = "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm"

# All not-class parameters to use in the POST request.
DEFAULT_PARAMETERS = "xsoc_term=&loggedIn=false&tabNum=tabs-subschedOption1=true&_schedOption1=on&_schedOption11=on&_schedOption12=on&schedOption2=true&_schedOption2=on&_schedOption4=on&_schedOption5=on&_schedOption3=on&_schedOption7=on&_schedOption8=on&_schedOption13=on&_schedOption10=on&_schedOption9=on&schDay=M&_schDay=on&schDay=T&_schDay=on&schDay=W&_schDay=on&schDay=R&_schDay=on&schDay=F&_schDay=on&schDay=S&_schDay=on&schStartTime=12%3A00&schStartAmPm=0&schEndTime=12%3A00&schEndAmPm=0&_selectedDepartments=1&schedOption1Dept=true&_schedOption1Dept=on&_schedOption11Dept=on&_schedOption12Dept=on&schedOption2Dept=true&_schedOption2Dept=on&_schedOption4Dept=on&_schedOption5Dept=on&_schedOption3Dept=on&_schedOption7Dept=on&_schedOption8Dept=on&_schedOption13Dept=on&_schedOption10Dept=on&_schedOption9Dept=on&schDayDept=M&_schDayDept=on&schDayDept=T&_schDayDept=on&schDayDept=W&_schDayDept=on&schDayDept=R&_schDayDept=on&schDayDept=F&_schDayDept=on&schDayDept=S&_schDayDept=on&schStartTimeDept=12%3A00&schStartAmPmDept=0&schEndTimeDept=12%3A00&schEndAmPmDept=0&courses=&sections=&instructorType=begin&instructor=&titleType=contain&title=&_hideFullSec=on&_showPopup=off"

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
    
    args = dict(parse.parse_qsl(DEFAULT_PARAMETERS))
    args["selectedTerm"] = term
    args["selectedDepartments"] = departments
    args["page"] = pagenumber

    r = requests.post(SoC_URL, args)
    return r.text

def stripTag(tag):
    """
    Returns the first string within the given HTML tag
    """

    for string in tag.stripped_strings:
        return string
    return "N/A"

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
            section_dict[fieldnames[k]] = stripTag(fields[j])
        i += numcols
        j += 1

    return section_dict



def parsePage(html, term="SP16"):
    """
    Parses a list of course Dicts extracted from the provided HTML, as well as the
    corresponding sections and exams.
    """

    soup = BeautifulSoup(html, "html.parser")
    course_titles = soup.find_all("td", class_="crsheader", colspan="5")
    for course in course_titles:
        course_dict = {}

        dept = re.search(r"\((.*)\)", course.find_previous("h2")("span")[0].string).group(1)
        num = course.find_previous_sibling("td", class_="crsheader").string

        course_dict["Title"] = course.find("span", class_="boldtxt").string.strip()
        course_dict["Code"] = dept + num
        course_dict["Term"] = term

        print(course_dict)

        tr = course.parent.next_sibling.next_sibling
        while(tr):
            if tr.get("class") is None:
                break

            elif "sectxt" in tr['class']:
                section_dict = getExamOrSection(tr, SECTION_FIELDS, SECTION_INIT_COL)
                print(section_dict)

            elif "nonenrtxt" in tr['class']:
                exam_dict = getExamOrSection(tr, EXAM_FIELDS, EXAM_INIT_COL)
                print(exam_dict)

            else:
                break

            tr = tr.find_next_sibling("tr")



depts = getDepartments()
page = 1
html = getSoCPage(depts, page)
while "Exception Report" not in html:
    print(page)
    parsePage(html)
    page += 1
    html = getSoCPage(depts, page)
