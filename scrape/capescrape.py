from bs4 import BeautifulSoup 
import bs4
import urllib2
import cookielib
import json
import requests
import re
from collections import OrderedDict
import multiprocessing

BASE_URL="https://cape.ucsd.edu/responses/Results.aspx?Name=&CourseNumber="
DEPARTMENT_LIST_URL="https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudent.htm"
GET_DEPT_URL = "https://act.ucsd.edu/scheduleOfClasses/department-list.json"
RATINGS_URL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid='
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api/"
RMP_SEARCH = "http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&q={fname}+{lname}&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20&schoolid_s=1079"
COLD_CHILI_PIC = '/assets/chilis/cold-chili.png'    # image name for cold chili pepper

# ========================================
# Purpose: Gets soup for a website
# ======================================== 
def get_soup(url):
    print url
    r = requests.get(url, headers={"User-agent":'Mozilla'})
    html = r.text
    soup = BeautifulSoup(html, "html.parser");
    return soup

# ========================================
# Purpose: Gets list of UCSD departments
# ======================================== 
def get_departments():
    return ['AIP', 'ANBI', 'ANAR', 'ANTH', 'ANSC', 'AESE', 'BNFO', 'BIEB', 'BICD', 'BIPN', 'BIBC', 'BGGN', 'BGSE', 'BILD', 'BIMM', 'BISP', 'BIOM',  'CHEM', 'CHIN', 'CLAS', 'CLIN', 'COGS', 'COMM', 'COGR', 'ICAM', 'CONT', 'CGS', 'CAT', 'TDCH', 'TDHD', 'TDMV', 'TDTR', 'DOC', 'ECON', 'EAP', 'EDS', 'ERC', 'ECE', 'ENG', 'ENVR', 'ESYS', 'ETHN', 'EXPR', 'FPMU', 'FILM', 'HITO', 'HIAF', 'HIEA', 'HIEU', 'HILA', 'HISC', 'HINE', 'HIUS', 'HIGR', 'HILD', 'HDP', 'HUM', 'INTL', 'IRCO', 'IRGN', 'IRLA', 'JAPN', 'JUDA', 'LATI', 'LAWS', 'LISL', 'LIAB', 'LIFR', 'LIGN', 'LIGM', 'LIHL', 'LIIT', 'LIPO', 'LISP', 'LTCH', 'LTCO', 'LTCS', 'LTEU', 'LTFR', 'LTGM', 'LTGK', 'LTIT', 'LTKO', 'LTLA', 'LTRU', 'LTSP', 'LTTH', 'LTWR', 'LTEN', 'LTWL', 'LTEA', 'MMW', 'MBC', 'MATS', 'MATH', 'MSED', 'MAE', 'MUIR', 'MCWP', 'MUS', 'NANO', 'PHAR', 'SPPS', 'PHIL', 'PHYS', 'POLI', 'PSYC', 'MGT', 'RELI', 'REV', 'SDCC', 'SIO', 'SXTH', 'SOCG', 'SOCE', 'SOCI', 'SE', 'TDAC', 'TDDE', 'TDDR', 'TDGE', 'TDGR', 'TDHT', 'TDPW', 'TDPR', 'TWS', 'TMC', 'USP', 'VIS', 'WARR', 'WCWP']
     

def get_gradedistributions(url):
    expected = None
    received = None
    if url is None:
        return expected, received, ""
    site = "https://cape.ucsd.edu/responses/"
    if url.startswith('.'):
        url = url[2:]
        site = "https://cape.ucsd.edu" + url
        r = requests.get(site, headers={"User-agent":'Mozilla'})
        soup = BeautifulSoup(r.text, "html.parser");
        tables = soup.findAll('table')
        table_expected = tables[3]
        if table_expected is not None:
           rows = table_expected.findChildren(['tr'])
           if rows is not None:
               expectedrow = rows[2]
               cells = expectedrow.findChildren(['td'])
               A = cells[3].text.encode('utf-8')
               B = cells[4].text.encode('utf-8')
               C = cells[5].text.encode('utf-8')
               D = cells[6].text.encode('utf-8')
               F = cells[7].text.encode('utf-8')
               P = cells[8].text.encode('utf-8')
               NP = cells[9].text.encode('utf-8')
               expected = {'A': A,'B': B,'C': C,'D': D, 'F': F, 'P': P, 'NP': NP}
    else:
        site += url
        r = requests.get(site, headers={"User-agent":'Mozilla'})
        soup = BeautifulSoup(r.text, "html.parser");
        tables = soup.findAll('table')
        table_expected = soup.find('table', id = "ctl00_ContentPlaceHolder1_tblExpectedGrades") 
        table_received = soup.find('table', id = "ctl00_ContentPlaceHolder1_tblGradesReceived")
        if table_expected is not None:
           rows = table_expected.findChildren(['tr'])
           if rows is not None:
               expectedrow = rows[2]
               cells = expectedrow.findChildren(['td'])
               A = cells[0].text.encode('utf-8').split("%")[0]
               B = cells[1].text.encode('utf-8').split("%")[0]
               C = cells[2].text.encode('utf-8').split("%")[0]
               D = cells[3].text.encode('utf-8').split("%")[0]
               F = cells[4].text.encode('utf-8').split("%")[0]
               P = cells[5].text.encode('utf-8').split("%")[0]
               NP = cells[6].text.encode('utf-8').split("%")[0]
               expected = {'A': A,'B': B,'C': C,'D': D, 'F': F, 'P': P, 'NP': NP}
        if table_received is not None:
            rows = table_received.findChildren(['tr'])
            if rows is not None:
                receivedrow = rows[2]
                cells = receivedrow.findChildren(['td']) 
                A2 = cells[0].text.encode('utf-8').split("%")[0]
                B2 = cells[1].text.encode('utf-8').split("%")[0]
                C2 = cells[2].text.encode('utf-8').split("%")[0]
                D2 = cells[3].text.encode('utf-8').split("%")[0]
                F2 = cells[4].text.encode('utf-8').split("%")[0]
                P2 = cells[5].text.encode('utf-8').split("%")[0]
                NP2 = cells[6].text.encode('utf-8').split("%")[0]
                received = {'A': A2,'B': B2,'C': C2,'D': D2, 'F': F2, 'P': P2, 'NP': NP2}
    return expected, received, site
    

# ========================================
# Purpose: Gets CAPE Data for a
# 		   specified department
# ======================================== 
def get_cape_data_for_dept(dept):
    prof_cache = {}
    catalog_cache = {}

    # gets soup
    soup = get_soup(BASE_URL+dept)
    row = None

    # gets container with row
    test_row = soup.find('table',{'id': 'ctl00_ContentPlaceHolder1_gvCAPEs'})
    
    # check if row has valid data
    if test_row.tbody is not None:
        row = test_row.tbody.tr
        print 'Getting CAPE data for ' + dept
    else:
        print 'No CAPE data for ' + dept
        return None

    # list of rows, each row is a dictionary representing data from each column 
    # for that row
    cape_data = []
    row_num = 0
    # iterate through each row of the CAPES for the department, filling up list with 
    # one row at a time
    while isinstance(row, bs4.element.Tag):
    # Debug Only
    # while row_num == 0:
        # declare variables to record
        instructor = None
        course = None
        term = None
        enroll = None
        evals = None
        rcmndclass = None
        rcmndinstr = None
        hrsperwk = None
        gradeexp = None
        graderec = None
        expected_grade = None
        received_grade = None

        # get instructor
        working_col = row.td
        instructor = working_col.contents[0]

        # get course
        working_col = working_col.next_sibling
        link = working_col.find('a').get('href')
        course_info = working_col.a.contents[0].split('-')
        course = course_info[0][:-1]

        # get gradedistributions
        expected_grade, received_grade, site = get_gradedistributions(link)
       

        # get term
        working_col = working_col.next_sibling
        term = working_col.contents[0]

        # get enroll
        working_col = working_col.next_sibling
        enroll = working_col.contents[0]

        # get evals
        working_col = working_col.next_sibling
        evals = working_col.span.contents[0]

        # get rcmndclass
        working_col = working_col.next_sibling
        rcmndclass = working_col.span.contents[0]
        rcmndclass = rcmndclass.split("%")[0]

        # get rcmndinstr
        working_col = working_col.next_sibling
        rcmndinstr = working_col.span.contents[0]
        rcmndinstr = rcmndinstr.split("%")[0]

        # get hrsperwk
        working_col = working_col.next_sibling
        hrsperwk = working_col.span.contents[0]

        # get gradeexp
        working_col = working_col.next_sibling
        gradeexp = working_col.span.contents[0]
        extract = re.match("[A-F][+-]? \(([0-9]\.[0-9]+)\)", gradeexp)
        if extract is not None:
            gradeexp = extract.group(1)

        # get graderec
        working_col = working_col.next_sibling
        graderec = working_col.span.contents[0]
        extract = re.match("[A-F][+-]? \(([0-9]\.[0-9]+)\)", graderec)
        if extract is not None:
            graderec = extract.group(1)

        # reformat instructor names
        if instructor.strip() == "": # ECE 108
            row = row.next_sibling
            continue
        names = instructor.split(", ")
        ln = names[0]
        fn = " ".join(names[1:])
        instructor = fn.strip() + " " + ln.strip()
        lname = ln
        fname = names[1].split(" ")[0]
        
        prof_id = None
        if instructor not in prof_cache:
            r = requests.get(DB_URL + "/professor/" + instructor)
            prof_id = json.loads(r.text)[0]["id"] if r.text != "[]" else None #update_RMP_prof(fname, lname, instructor) 
            prof_cache[instructor] = prof_id
        else:
            prof_id = prof_cache[prof_id]
        
        if prof_id is None:
            continue

        courses = None
        if course not in catalog_cache:
            r = requests.get(DB_URL + "catalog/" + course)
            courses = json.loads(r.text)
            catalog_cache[instructor] = courses
        else:
            courses = catalog_cache[course]

        if len(courses) == 0:
            print "WARNING: Could not find course: " + course
            row = row.next_sibling
            continue

        if len(courses) > 1:
            print "ERROR: Duplicate Courses: " + str(courses) 
        catalog_id = courses[0]["id"]

        # enter data into dictionary
        entry = {
            'professor_id': prof_id,
            'course_id': catalog_id,
            'term': term,
            'enroll': int(enroll),
            'cape_num_evals': int(evals),
            'rcmnd_class': format_float(rcmndclass),
            'cape_rec_prof': format_float(rcmndinstr),
            'cape_study_hrs': format_float(hrsperwk),
            #'gradeexp': gradeexp,
            'cape_prof_gpa': format_float(graderec),
            #'cape_expected_grade': expected_grade,
            'a_percentage': format_float(received_grade["A"]) if received_grade is not None else -1,
            'b_percentage': format_float(received_grade["B"]) if received_grade is not None else -1,
            'c_percentage': format_float(received_grade["C"]) if received_grade is not None else -1,
            'd_percentage': format_float(received_grade["D"]) if received_grade is not None else -1,
            'f_percentage': format_float(received_grade["F"]) if received_grade is not None else -1,
            'p_percentage': format_float(received_grade["P"]) if received_grade is not None else -1,
            'np_percentage': format_float(received_grade["NP"]) if received_grade is not None else -1,
            'cape_url':  site
        }
        
        
        cape_data.append(entry)
        row = row.next_sibling
    r = requests.post(DB_URL + "cape/batch", {"capes":cape_data})
    return dept

def format_float(fstring):
    if fstring == "N/A":
        return -1
    return int(float(fstring) * 100)

def parse_term(term):
    terms = {
            "FA":"Fall",
            "WI":"Winter",
            "SP":"Spring",
            "S1":"Summer Session 1",
            "S2":"Summer Session 2"
    }
    split = re.match(r"([A-Z]+)([0-9]+)", term)
    out = {}
    out["term_name"] = term
    out["quarter"] = terms[split.group(1)]
    out["year"] = "20" + split.group(2)
    return out

def update_RMP_prof(fname, lname, cape_name):
    professor = {}
    professor['name'] = cape_name
    professor['rmp_overall'] = 0
    professor['rmp_helpful'] = 0
    professor['rmp_clarity'] = 0
    professor['rmp_easiness'] = 0
    professor['rmp_hot'] = 0
    professor["rmp_tid"] = 0

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
            if chili_file[2] == None:
                print fname, lname
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
            professor["rmp_tid"] = tid

        r = requests.post(DB_URL + "professor/update", professor)
        return json.loads(r.text)[0]["id"]

if __name__ == "__main__":
    # Debug Only
    # cape_data = get_cape_data_for_dept("CSE", br)
    # print cape_data

    # ========================================
    # data structure to hold all of the capes
    # format:
    #
    # capes_by_departments {
    #	'dept1': [ 
    #		{
    # 			'instructor': string,
    #			'course': string,
    # 			'term': string,
    # 			'enroll': strin,
    #			'evals': string,
    #			'rcmndclass': string,
    #			'rcmndinstr': string,
    #			'hrsperweek': string,
    #			'gradeexp': string,
    #			'graderec': string
    #		},
    #		{
    #			...
    #		},
    #		....
    #	]
    #	'dept2': [
    #		... 
    #	]
    #   ...
    # }
    #
    # ===========================================

    # dict to hold ALL the cape data
    capes_by_departments = {}

    # get list of departments
    departments = get_departments()

    pool = multiprocessing.Pool(processes=50)
    # get capes for each department
    completed = 0
    num_depts = len(departments)
    for x in pool.imap_unordered(get_cape_data_for_dept, departments):
        completed += 1
        print "{}/{} departments completed".format(completed, num_depts)
        

