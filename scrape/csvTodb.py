import csv
import requests
import json
import re
from bs4 import BeautifulSoup

def split_course_name(name):
    match = re.match("([A-Z]*)(.*)", name)
    return " ".join(match.groups())

AUX_TYPES = ["DI", "LA"]
NO_SEATS = ["", "Unlim "]

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


# TERM stuff
RATINGS_URL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid='
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api"
RMP_SEARCH = "http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&q={fname}+{lname}&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20&schoolid_s=1079"
COLD_CHILI_PIC = '/assets/chilis/cold-chili.png'    # image name for cold chili pepper


term_data = {
    "term_name":"FA16",
    "quarter":"Fall",
    "year":"2016"
}


term_id = None
r = requests.get(DB_URL + "/term/" + term_data["term_name"])
if r.text == "[]":
    r = requests.post(TERM_API, term_data)
    term_id = json.loads(r.text)[0]["term_id"]
else:
    term_id = json.loads(r.text)[0]["id"]

with open("courses.csv", "r") as f_courses, \
     open("sections.csv", "r") as f_sections, \
     open("exams.csv") as f_exams:

    courses = list(csv.DictReader(f_courses))
    sections = list(csv.DictReader(f_sections))
    exams = list(csv.DictReader(f_exams))

    ids = map(lambda x : x["ID"], courses)
    sections_dict = {str(key):[x for x in sections if x["ID"] == str(key)] for key in ids}
    exams_dict = {str(key):[x for x in exams if x["ID"] == str(key)] for key in ids}

    for course in courses:
        course_dict = {}

        course_name = split_course_name(course["Code"])
        r = requests.get(DB_URL + "/catalog/" + course_name)
        if r.text == "[]":
            print "ERROR: Could not find course: " + course_name
            continue

        response = json.loads(r.text)[0]
        catalog_course_id = response["id"]
        course_title = response["course_name"]
        desc = response["description"]
        prereqs = response["prereqs"]
        units = response["units"]

        r = requests.get(DB_URL + "/courses/specific/" + catalog_course_id + "/" + term_id)

        course_id = None
        if r.text != "[]":
            course_id = json.loads(r.text)[0]["id"]
        else:
            course_dict["term_id"] = term_id
            course_dict["course_id"] = course_name
            course_dict["catalog_course_id"] = catalog_course_id
            course_dict["course_name"] = course_title
            course_dict["description"] = desc
            course_dict["prereqs"] = prereqs
            course_dict["units"] = units if units is not None else ""

            print course_dict["course_id"]
            r = requests.post(DB_URL + "/courses", course_dict)
            course_id = json.loads(r.text)[0]["id"]

        course_sections = sections_dict[course["ID"]]
        lecture_id = None
        prev_lecture_code = None
        for meeting in course_sections:
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

                print section

                fname, lname, professor = format_prof_name(meeting["Professor"])
                print professor
               
                r = requests.get(DB_URL + "/professor/" + professor)
                print r.text

                prof_id = make_RMP_prof(fname, lname, professor) if r.text == "[]" else json.loads(r.text)[0]["id"]
                section["professor_id"] = prof_id
                
                r = requests.post(DB_URL + "/section", section)
                lecture_id = json.loads(r.text)[0]["id"]
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

                print discussion

                r = requests.post(DB_URL + "/discussions", discussion)
                if r.text == "500":
                    raise Exception
                

        course_exams = exams_dict[course["ID"]]
        for exam in course_exams:
            exam_data = {}
            exam_data["section_id"] = lecture_id
            exam_data["exam_type"] = exam["Type"]
            exam_data["exam_start_time"] = exam["Time"].split("-")[0] if exam["Time"] != "TBA" else "TBA"
            exam_data["exam_end_time"] = exam["Time"].split("-")[1] if exam["Time"] != "TBA" else "TBA"
            exam_data["exam_location"] = exam["Building"] + " " + exam["Room"] if exam["Building"] != "TBA" else "TBA"
            exam_data["exam_date"] = exam["Date"]

            print exam_data

            r = requests.post(DB_URL + "/exams", exam_data)
            if r.text == "500":
                raise Exception


