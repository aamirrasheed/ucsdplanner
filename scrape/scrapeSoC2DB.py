import requests 
from bs4 import BeautifulSoup
import json
import re
import csv
from datetime import datetime
import time

# POST url to get the schedule of classes
GET_DEPT_URL = "https://act.ucsd.edu/scheduleOfClasses/department-list.json"
SoC_URL = "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm"
RATINGS_URL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid='
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api"
RMP_SEARCH = "http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&q={fname}+{lname}&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20&schoolid_s=1079"
COLD_CHILI_PIC = '/assets/chilis/cold-chili.png'    # image name for cold chili pepper


AUX_TYPES = ["DI", "LA"]
NO_SEATS = ["", "Unlim "]

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

term_data = {
    "term_name":"FA16",
    "quarter":"Fall",
    "year":"2016"
}

# Fields grabbed from each course section
SECTION_FIELDS = ["Id", "Type", "Code", "Days", "Time", "Building", "Room", "Professor", "SeatsOpen", "TotalSeats"]

# First nonempty column in table for course entries
SECTION_INIT_COL = 2

# Fields grabbed from each exam section
EXAM_FIELDS = ["Id", "Type", "Date", "Days", "Time", "Building", "Room", "Professor", "SeatsOpen", "TotalSeats"]

# First nonempty column in table for exam entries
EXAM_INIT_COL = 1

def split_course_name(name):
    match = re.match("([A-Z]*)(.*)", name)
    return " ".join(match.groups())

def parse_seats(string):
    if string in NO_SEATS:
        return -1, -1

    s = re.match("FULL Waitlist\(([0-9]+)\)", string)

    if s is not None:
        return 0, int(s.group(1))

    else:
        return int(string), 0

def format_float(fstring):
    if fstring == "N/A":
        return -1
    return int(float(fstring) * 100)

def format_prof_name(name):
    """
    Input a professor's name in CAPE format
    Outputs the first name, last name, and our formatted name (First Middle Last)
    """
    
    if name == "Staff":
        return "Staff", "Staff", "Staff"
    if name == "":
        return "None", "None", "None"
    names = name.split(", ")
    ln = names[0]
    fn = " ".join(names[1:])
    lname = ln
    fname = names[1].split(" ")[0]
    professor = fn.strip() + " " + ln.strip()
    return fname, lname, professor

def make_RMP_prof(fname, lname, cape_name):
    professor = {}
    professor['name'] = cape_name
    professor['rmp_overall'] = 0
    professor['rmp_helpful'] = 0
    professor['rmp_clarity'] = 0
    professor['rmp_easiness'] = 0
    professor['rmp_hot'] = 0
    professor['rmp_tid'] = 0

    r = requests.get(RMP_SEARCH.format(fname = fname, lname = lname))
    profs = json.loads(r.text)["grouped"]["content_type_s"]["groups"]

    if len(profs) == 0:
        r = requests.post(DB_URL + "/professor", professor)
        print r.text
        return json.loads(r.text)[0]["id"]
    
    profs = profs[0]["doclist"]["docs"]

    profs = list(filter(lambda x: x["schoolname_s"] == "University of California San Diego", profs))

    if len(profs) == 0:
        r = requests.post(DB_URL + "/professor", professor)
        print r.text
        return json.loads(r.text)[0]["id"]

    else:
        tid = profs[0]["pk_id"]
        r = requests.get(RATINGS_URL + str(tid))

        soup = BeautifulSoup(r.text, "html.parser")
        header = soup.find("div", "left-breakdown")

        # if header is None, then there are no ratings for prof
        if header != None:
            overall_rating = soup.find("div", "grade").string
            chili_figure = [grade.figure for grade in soup.findAll("div", "grade")]
            chili_figure = chili_figure[2].img.get('src')

            ratings = soup.findAll("div", "rating")
            helpfulness = ratings[0].string
            clarity = ratings[1].string
            easiness = ratings[2].string

            # dictionary of prof ratings to be put in data
            professor['name'] = cape_name
            professor['rmp_overall'] = overall_rating
            professor['rmp_helpful'] = helpfulness
            professor['rmp_clarity'] = clarity
            professor['rmp_easiness'] = easiness
            professor['rmp_hot'] = 1 if chili_figure != COLD_CHILI_PIC else 0

        r = requests.post(DB_URL + "/professor", professor)
        return json.loads(r.text)[0]["id"]

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
        course_sections = []
        course_exams = []

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
                course_sections.append(section_dict)

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
                course_exams.append(exam_dict)

            else:
                break

            tr = tr.find_next_sibling("tr")
        ID += 1
        postCourse(course_dict, course_sections, course_exams)

    return (courses, sections, exams)

def postCourse(course, sections, exams):
    print ""
    print course
    print sections
    print exams

    course_name = split_course_name(course["Code"])

    r = requests.get(DB_URL + "/catalog/" + course_name)
    if r.text == "[]":
        print "ERROR: Could not find course: " + course_name
        return None
    response = json.loads(r.text)[0]

    catalog_course_id = response["id"]
    course_title = response["course_name"]
    desc = response["description"]
    prereqs = response["prereqs"]
    units = response["units"]

    term_id = None
    r = requests.get(DB_URL + "/term/" + term_data["term_name"])
    if r.text == "[]":
        r = requests.post(TERM_API, term_data)
        term_id = json.loads(r.text)[0]["term_id"]
    else:
        term_id = json.loads(r.text)[0]["id"]


    r = requests.get(DB_URL + "/courses/specific/" + catalog_course_id + "/" + term_id)
    course_id = None
    if r.text != "[]":
        course_id = json.loads(r.text)[0]["id"]
    else:
        course_dict = {}
        course_dict["term_id"] = term_id
        course_dict["course_id"] = course_name
        course_dict["catalog_course_id"] = catalog_course_id
        course_dict["course_name"] = course_title
        course_dict["description"] = desc
        course_dict["prereqs"] = prereqs
        course_dict["units"] = units if units is not None else ""

        r = requests.post(DB_URL + "/courses", course_dict)
        course_id = json.loads(r.text)[0]["id"]


    lecture_id = None
    prev_lecture_code = None
    discussions = []
    course_exams = []
    for meeting in sections:
        if meeting["Days"] == "Cancelled":
            continue
        if (meeting["Type"] not in AUX_TYPES and  \
            meeting["Code"] != prev_lecture_code)  or \
            lecture_id is None:
            section = {}
            section["course_id"] = course_id
            section["section_id"] = int(meeting["Id"]) if meeting["Id"] != "" else 0
            section["section_name"] = meeting["Code"]
            section["term_name"] = term_data["term_name"]
            section["term_id"] = term_id
            section["type"] = meeting["Type"]
            section["section_days"] = meeting["Days"]
            section["section_start_time"] = meeting["Time"].split("-")[0] if meeting["Time"] != "TBA" else "TBA"
            section["section_end_time"] = meeting["Time"].split("-")[1] if meeting["Time"] != "TBA" else "TBA"
            section["location"] = meeting["Building"] + " " + meeting["Room"] if meeting["Building"] != "TBA" else "TBA"
            section["sec_seats_avail"] = parse_seats(meeting["SeatsOpen"])[0]
            section["sec_seats_total"] = parse_seats(meeting["TotalSeats"])[0]
            section["sec_waitlist"] = parse_seats(meeting["SeatsOpen"])[1]

            fname, lname, professor = format_prof_name(meeting["Professor"])
           
            r = requests.get(DB_URL + "/professor/" + professor)

            prof_id = make_RMP_prof(fname, lname, professor) if r.text == "[]" else json.loads(r.text)[0]["id"]
            section["professor_id"] = prof_id

            # find the corresponding section_id
            r = requests.get(DB_URL + "/section/" + course_id + "/" + prof_id)
            section_ids = [x["id"] for x in json.loads(r.text)]
            for section_id in section_ids:
                r = requests.get(DB_URL + "/section/" + section_id)
                print r.text
                if json.loads(r.text)[0]["section_name"] == section["section_name"]:
                    r = requests.put(DB_URL + "/section/" + section_id, section)
                    lecture_id = section_id

                    r = requests.get(DB_URL + "/discussions/" + section_id)
                    discussions = [x["id"] for x in json.loads(r.text)]

                    r = requests.get(DB_URL + "/exams/" + section_id)
                    course_exams = [x["id"] for x in json.loads(r.text)]

                    prev_lecture_code = meeting["Code"]

        else:
            discussion = {}
            assert lecture_id is not None

            discussion["section_id"] = lecture_id
            discussion["disc_id"]  = int(meeting["Id"]) if meeting["Id"] != "" else 0
            discussion["disc_name"] = meeting["Code"]
            discussion["type"] = meeting["Type"]
            discussion["disc_days"] = meeting["Days"]
            discussion["disc_start_time"] = meeting["Time"].split("-")[0] if meeting["Time"] != "TBA" else "TBA"
            discussion["disc_end_time"] = meeting["Time"].split("-")[1] if meeting["Time"] != "TBA" else "TBA"
            discussion["disc_location"] = meeting["Building"] + " " + meeting["Room"] if meeting["Building"] != "TBA" else "TBA"
            discussion["disc_seats_avail"] = parse_seats(meeting["SeatsOpen"])[0]
            discussion["disc_seats_total"] = parse_seats(meeting["TotalSeats"])[0]
            discussion["disc_waitlist"] = parse_seats(meeting["SeatsOpen"])[1]

            if len(discussions) > 0:
                discussion_id, discussions = discussions[0], discussions[1:]
                r = requests.put(DB_URL + "/discussions" + discussion_id, discussion)
            else:
                r = requests.post(DB_URL + "/discussions", discussion)

    for exam in exams:
        exam_data = {}
        exam_data["section_id"] = lecture_id
        exam_data["exam_type"] = exam["Type"]
        exam_data["exam_start_time"] = exam["Time"].split("-")[0] if exam["Time"] != "TBA" else "TBA"
        exam_data["exam_end_time"] = exam["Time"].split("-")[1] if exam["Time"] != "TBA" else "TBA"
        exam_data["exam_location"] = exam["Building"] + " " + exam["Room"] if exam["Building"] != "TBA" else "TBA"
        exam_data["exam_date"] = exam["Date"]

        if len(course_exams) > 0:
            exam_id, course_exams = course_exams[0], course_exams[1:]
            r = requests.put(DB_URL + "/exams" + exam_id, exam_data)
        else:
            r = requests.post(DB_URL + "/exams", exam_data)

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