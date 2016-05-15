import csv
import requests
import json
import re

def split_course_name(name):
    match = re.match("([A-Z]*)(.*)", name)
    return " ".join(match.groups())

AUX_TYPES = ["DI", "LA"]
NO_SEATS = ["", "Unlim"]

def parse_seats(string):
    if string in NO_Seats:
        return None, None
    s = re.match("FULL Waitlist\(([0-9]+)\)", string)
    if s is not None:
        return 0, int(s.group(1))
    else:
        return int(string), 0

# TERM stuff
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api" 

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

    sections_dict = {key:[x for x in sections if x["ID"] == str(key)] for key in range(len(courses))}
    exams_dict = {key:[x for x in exams if x["ID"] == str(key)] for key in range(len(courses))}

    for course in courses:

        course_dict = {}

        course_name = split_course_name(course["Code"])
        r = requests.get(DB_URL + "/catalog/" + course_name)
        if r.text = "[]"
            print "ERROR: Could not find course: " + course_name
            continue

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

        course_sections = sections_dict[course["ID"]]
        lecture_id = None
        prev_lecture_code = None
        for meeting in course_sections:
            if meeting["Type"] not in AUX_TYPES and meeting["Code"] != prev_lecture_code:
                section = {}
                section["course_id"] = meeting["Id"]
                section["section_name"] = meeting["Code"]
                section["type"] = meeting["Type"]
                section["section_days"] = meeting["Days"]
                section["section_start_time"] = meeting["Time"].split("-")[0] if meeting["Time"] != "TBA" else "TBA"
                section["section_end_time"] = meeting["Time"].split("-")[1] if meeting["Time"] != "TBA" else "TBA"
                section["location"] = meeting["Building"] + " " + meeting["Room"]
                section["sec_seats_avail"] = parse_seats(meeting["SeatsOpen"])[0]
                section["sec_seats_total"] = parse_seats(meeting["TotalSeats"])[0]
                section["sec_waitlist"] = parse_seats(meetings["SeatsOpen"][1])

                names = meetings["Professor"].split(", ")
                ln = names[0]
                fn = " ".join(names[1:])
                lname = ln
                fname = names[1].split(" ")[0]
                professor = fn.strip() + " " + ln.strip()
                r = requests.get(DB_URL + "/professor/" + professor)

                prof_id = make_RMP_prof(fname, lname, professor) if r.text == "[]" else json.loads(r.text)[0]["id"]
                section["professor_id"] = prof_id
                
                r = requests.post(DB_URL + "/section", section)
                lecture_id = json.loads(r.text)[0]["section_id"]
                prev_lecture_code = meeting["Code"]

            else:
                discussion = {}
                assert lecture_id is not None
                discussion["section_id"] = lecture_id
                discussion["type"] = meetings["Type"]
                discussion["disc_days"] = meetings["Days"]
                discussion["disc_start_time"] = meeting["Time"].split("-")[0] if meeting["Time"] != "TBA" else "TBA"
                discussion["disc_end_time"] = meeting["Time"].split("-")[1] if meeting["Time"] != "TBA" else "TBA"
                discussion["location"] = meeting["Building"] + " " + meeting["Room"]
                discussion["disc_seats_avail"] = parse_seats(meeting["SeatsOpen"])[0]
                discussion["disc_seats_total"] = parse_seats(meeting["TotalSeats"])[0]
                discussion["disc_waitlist"] = parse_seats(meetings["SeatsOpen"][1])

                r = requests.post(DB_URL + "/discussions", section)
                

        course_exams = exams_dict[course["ID"]]
        for exam in course_exams:
            exam_data = {}
            exam_data["section_id"] = lecture_id
            exam_data["exam_type"] = exam["Type"]
            exam_data["exam_start_time"] = exam["Time"].split("-")[0] if exam["Time"] != "TBA" else "TBA"
            exam_data["exam_end_time"] = exam["Time"].split("-")[1] if exam["Time"] != "TBA" else "TBA"
            exam_data["exam_location"] = exam["Building"] + " " + exam["Room"]
            exam_data["exam_date"] = exam["Date"]


def make_RMP_prof(fname, lname, cape_name):
    professor = {}
    professor['name'] = cape_name
    professor['rmp_overall'] = 0
    professor['rmp_helpful'] = 0
    professor['rmp_clarity'] = 0
    professor['rmp_easiness'] = 0
    professor['rmp_hot'] = 0

    r = requests.get(RMP_SEARCH.format(fname = fname, lname = lname))
    profs = json.loads(r.text)["grouped"]["content_type_s"]["groups"]

    if len(profs) == 0:
        r = requests.post(DB_URL + "professor", professor)
        return json.loads(r.text)[0]["id"]
    
    profs = profs[0]["doclist"]["docs"]

    profs = list(filter(lambda x: x["schoolname_s"] == "University of California San Diego" , profs))

    if len(profs) == 0:
        r = requests.post(DB_URL + "professor", professor)
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

        r = requests.post(DB_URL + "professor", professor)
        return json.loads(r.text)[0]["id"]

