from bs4 import BeautifulSoup 
import bs4
import urllib2
import cookielib
import json
import requests
import re

BASE_URL="https://cape.ucsd.edu/responses/Results.aspx?Name=&CourseNumber="
DEPARTMENT_LIST_URL="https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudent.htm"
GET_DEPT_URL = "https://act.ucsd.edu/scheduleOfClasses/department-list.json"
RATINGS_URL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid='
DB_URL = "https://ucsdplanner-api.azure-mobile.net/api/"
RMP_SEARCH = "http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&q={fname}+{lname}&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20&schoolid_s=1079"

# ========================================
# Purpose: Gets soup for a website
# ======================================== 
def get_soup(url):
        r = requests.get(url, headers={"User-agent":'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1'})
	html = r.text
	soup = BeautifulSoup(html, "html.parser");
	return soup

# ========================================
# Purpose: Gets list of UCSD departments
# ======================================== 
def get_departments():
        return ['AIP', 'ANBI', 'ANAR', 'ANTH', 'ANSC', 'AESE', 'BENG', 'BNFO', 'BIEB', 'BICD', 'BIPN', 'BIBC', 'BGGN', 'BGSE', 'BILD', 'BIMM', 'BISP', 'BIOM', 'CENG', 'CHEM', 'CHIN', 'CLAS', 'CLIN', 'COGS', 'COMM', 'COGR', 'CSE', 'ICAM', 'CONT', 'CGS', 'CAT', 'TDCH', 'TDHD', 'TDMV', 'TDTR', 'DOC', 'ECON', 'EAP', 'EDS', 'ERC', 'ECE', 'ENG', 'ENVR', 'ESYS', 'ETHN', 'EXPR', 'FPMU', 'FILM', 'HITO', 'HIAF', 'HIEA', 'HIEU', 'HILA', 'HISC', 'HINE', 'HIUS', 'HIGR', 'HILD', 'HDP', 'HUM', 'INTL', 'IRCO', 'IRGN', 'IRLA', 'JAPN', 'JUDA', 'LATI', 'LAWS', 'LISL', 'LIAB', 'LIFR', 'LIGN', 'LIGM', 'LIHL', 'LIIT', 'LIPO', 'LISP', 'LTCH', 'LTCO', 'LTCS', 'LTEU', 'LTFR', 'LTGM', 'LTGK', 'LTIT', 'LTKO', 'LTLA', 'LTRU', 'LTSP', 'LTTH', 'LTWR', 'LTEN', 'LTWL', 'LTEA', 'MMW', 'MBC', 'MATS', 'MATH', 'MSED', 'MAE', 'MUIR', 'MCWP', 'MUS', 'NANO', 'PHAR', 'SPPS', 'PHIL', 'PHYS', 'POLI', 'PSYC', 'MGT', 'RELI', 'REV', 'SDCC', 'SIOC', 'SIOG', 'SIOB', 'SIO', 'SXTH', 'SOCG', 'SOCE', 'SOCI', 'SE', 'TDAC', 'TDDE', 'TDDR', 'TDGE', 'TDGR', 'TDHT', 'TDPW', 'TDPR', 'TWS', 'TMC', 'USP', 'VIS', 'WARR', 'WCWP']


# ========================================
# Purpose: Gets CAPE Data for a
# 		   specified department
# ======================================== 
def get_cape_data_for_dept(dept):
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

		# get instructor
		working_col = row.td
		instructor = working_col.contents[0]

		# get course
		working_col = working_col.next_sibling
		course_info = working_col.a.contents[0].split('-')
		course = course_info[0][:-1]

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

		# get rcmndinstr
		working_col = working_col.next_sibling
		rcmndinstr = working_col.span.contents[0]

		# get hrsperwk
		working_col = working_col.next_sibling
		hrsperwk = working_col.span.contents[0]

		# get gradeexp
		working_col = working_col.next_sibling
		gradeexp = working_col.span.contents[0]

		# get graderec
		working_col = working_col.next_sibling
		graderec = working_col.span.contents[0]

                
                # reformat instructor names
                names = instructor.split(", ")
                ln = names[0]
                fn = " ".join(names[1:])
                instructor = fn.strip() + " " + ln.strip()
                lname = ln
                fname = names[1].split(" ")[0]
                
                prof_id = get_RMP_prof(fname, lname) 
                
                # TODO: Update to match new term-binding when possible 
                # Get or make term 
                r = requests.get(DB_URL + "term/" + term)
                terms = json.loads(r.text)
                if terms == []:
                    pass #r = requests.post(DB_URL, parseTerm(term))
                if len(terms) > 1:
                    print "ERROR: Duplicate Terms: " + str(terms) 
                #term_id = terms[0]["id"] 

                r = requests.get(DB_URL + "catalog/" + course)
                courses = json.loads(r.text)

                if len(courses) == 0:
                    print"WARNING: Could not find course: " + course
                    row = row.next_sibling
                    continue

                if len(courses) > 1:
                    print "ERROR: Duplicate Courses: " + str(courses) 
                catalog_id = courses[0]["id"]

		# enter data into dictionary
		entry = {
			'professor_id': prof_id,
			'catalog_id': catalog_id,
                        #'term_id': term_id,
                        'term': term,
			'enroll': enroll,
			'cape_num_evals': evals,
                        #'rcmndclass': rcmndclass,
			'cape_rec_prof': rcmndinstr,
			'cape_study_hrs': hrsperwk,
                        #'gradeexp': gradeexp,
			'cape_prof_gpa': graderec
		}
		
                # TODO: uncomment posting to DB
                #r = requests.post(DB_URL + "/cape", entry)
		# add entry to list
		cape_data.append(entry)
		row = row.next_sibling
	return cape_data

def parseTerm(term):
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

def get_RMP_prof(fname, lname):
    r = requests.get(RMP_SEARCH.format(fname = fname, lname = lname))

    profs = json.loads(r.text)["grouped"]["content_type_s"]["groups"]
    if len(profs) == 0:
        return 0
    profs = profs[0]["doclist"]["docs"]

    profs = list(filter(lambda x: x["schoolname_s"] == "University of California San Diego" , profs))

    if len(profs) == 0:
        return 0
    else:
        tid = profs[0]["pk_id"]
        r = requests.get(RATINGS_URL + tid)

        soup = BeautifulSoup(req.text, "html.parser")
        header = soup.find("div", "left-breakdown")

        professor = {}
        # if header is None, then there are no ratings for prof
        if header == None:
            professor['name'] = prof['name']
            professor['rmp_overall'] = None
            professor['rmp_helpful'] = None
            professor['rmp_clarity'] = None
            professor['rmp_easiness'] = None
            professor['rmp_hot'] = None

        else:
            overall_rating = soup.find("div", "grade").string
            chili_figure = [grade.figure for grade in soup.findAll("div", "grade")]
            chili_figure = chili_figure[2].img.get('src')

            ratings = soup.findAll("div", "rating")
            helpfulness = ratings[0].string
            clarity = ratings[1].string
            easiness = ratings[2].string

            # dictionary of prof ratings to be put in data
            professor['name'] = prof['name']
            professor['rmp_overall'] = overall_rating
            professor['rmp_helpful'] = helpfulness
            professor['rmp_clarity'] = clarity
            professor['rmp_easiness'] = easiness
            professor['rmp_hot'] = 1 if chili_figure != COLD_CHILI_PIC else 0

        r.post(DB_URL + "professor", professor)
        return json.loads(r.text)["id"]

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

    # get capes for each department
    for dept in departments:
            cape_data = get_cape_data_for_dept(dept)
            capes_by_departments[dept] = cape_data
            print "{} of {}".format(gotten, attempts)
    # output to fat ass json file
    with open('cape_data.json', 'w') as fp:
        json.dump(capes_by_departments, fp)
