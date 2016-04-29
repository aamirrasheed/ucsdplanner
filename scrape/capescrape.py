from bs4 import BeautifulSoup 
import bs4
import urllib2
import mechanize
import cookielib
import json

BASE_URL="https://cape.ucsd.edu/responses/Results.aspx?Name=&CourseNumber="
DEPARTMENT_LIST_URL="https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudent.htm"

# ========================================
# Purpose: Starts virtual browser
# ======================================== 
def get_virtual_browser():

	# Browser
	br = mechanize.Browser()

	# Cookie Jar
	cj = cookielib.LWPCookieJar()
	br.set_cookiejar(cj)

	# Browser options
	br.set_handle_equiv(True)
	br.set_handle_gzip(True)
	br.set_handle_redirect(True)
	br.set_handle_referer(True)
	br.set_handle_robots(False)

	# Follows refresh 0 but not hangs on refresh > 0
	br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

	# Want debugging messages?
	#br.set_debug_http(True)
	#br.set_debug_redirects(True)
	#br.set_debug_responses(True)

	# User-Agent (this is cheating, ok?)
	br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
	return br

# ========================================
# Purpose: Gets soup for a website
# ======================================== 
def get_soup(url, br):
	r = br.open(url)
	html = r.read()
	soup = BeautifulSoup(html, "html.parser");
	return soup

# ========================================
# Purpose: Gets list of UCSD departments
# ======================================== 
def get_departments(br):
	soup1 = BeautifulSoup('<select id="selectedSubjects" name="selectedSubjects" multiple="multiple" size="19"><option value="AIP ">AIP  - Academic Internship Program   </option><option value="ANBI">ANBI - Anthro/Biological Anthropology</option><option value="ANAR">ANAR - Anthropological Archeology    </option><option value="ANTH">ANTH - Anthropology                  </option><option value="ANSC">ANSC - Anthropology/Sociocultural    </option><option value="AESE">AESE - ArchitectureBsdEntrpSystmsEngr</option><option value="BENG">BENG - Bioengineering                </option><option value="BNFO">BNFO - Bioinformatics                </option><option value="BIEB">BIEB - Biol/Ecology, Behavior, &amp; Evol</option><option value="BICD">BICD - Biol/Genetics,Cellular&amp;Develop</option><option value="BIPN">BIPN - Biology/Animal Physiol&amp;Neurosc</option><option value="BIBC">BIBC - Biology/Biochemistry          </option><option value="BGGN">BGGN - Biology/Grad/General          </option><option value="BGSE">BGSE - Biology/Grad/Seminar          </option><option value="BILD">BILD - Biology/Lower Division        </option><option value="BIMM">BIMM - Biology/Molec Biol, Microbiol </option><option value="BISP">BISP - Biology/Special Studies       </option><option value="BIOM">BIOM - Biomedical Sciences           </option><option value="CENG">CENG - Chemical Engineering          </option><option value="CHEM">CHEM - Chemistry and Biochemistry    </option><option value="CHIN">CHIN - Chinese Studies               </option><option value="CLAS">CLAS - Classical Studies             </option><option value="CLIN">CLIN - Clinical Psychology           </option><option value="COGS">COGS - Cognitive Science             </option><option value="COMM">COMM - Communication                 </option><option value="COGR">COGR - Communication/Graduate        </option><option value="CSE ">CSE  - Computer Science &amp; Engineering</option><option value="ICAM">ICAM - Computing and the Arts        </option><option value="CONT">CONT - Contemporary Issues           </option><option value="CGS ">CGS  - Critical Gender Studies       </option><option value="CAT ">CAT  - Culture, Art, &amp; Technology    </option><option value="TDCH">TDCH - Dance/Choreography            </option><option value="TDHD">TDHD - Dance/History                 </option><option value="TDMV">TDMV - Dance/Movement                </option><option value="TDTR">TDTR - Dance/Theory                  </option><option value="DOC ">DOC  - Dimensions of Culture         </option><option value="ECON">ECON - Economics                     </option><option value="EAP ">EAP  - Education Abroad Program      </option><option value="EDS ">EDS  - Education Studies             </option><option value="ERC ">ERC  - Eleanor Roosevelt College     </option><option value="ECE ">ECE  - Electrical &amp; Computer Engineer</option><option value="ENG ">ENG  - Engineering                   </option><option value="ENVR">ENVR - Environmental Studies         </option><option value="ESYS">ESYS - Environmental Systems         </option><option value="ETHN">ETHN - Ethnic Studies                </option><option value="EXPR">EXPR - Exchange Programs             </option><option value="FPMU">FPMU - Family&amp;Prev Med Undergraduate </option><option value="FILM">FILM - Film Studies                  </option><option value="HITO">HITO - History Topics                </option><option value="HIAF">HIAF - History of Africa             </option><option value="HIEA">HIEA - History of East Asia          </option><option value="HIEU">HIEU - History of Europe             </option><option value="HILA">HILA - History of Latin America      </option><option value="HISC">HISC - History of Science            </option><option value="HINE">HINE - History of the Near East      </option><option value="HIUS">HIUS - History of the United States  </option><option value="HIGR">HIGR - History, Graduate             </option><option value="HILD">HILD - History, Lower Division       </option><option value="HDP ">HDP  - Human Development Program     </option><option value="HUM ">HUM  - Humanities                    </option><option value="INTL">INTL - International Studies         </option><option value="IRCO">IRCO - Intrnat Relat/Pac Study-Core  </option><option value="IRGN">IRGN - Intrnat Relat/Pac Study-Generl</option><option value="IRLA">IRLA - Intrnat Relat/Pac Study-Lang  </option><option value="JAPN">JAPN - Japanese Studies              </option><option value="JUDA">JUDA - Judaic Studies                </option><option value="LATI">LATI - Latin American Studies        </option><option value="LAWS">LAWS - Law and Society               </option><option value="LISL">LISL - Linguistics/Amer Sign Language</option><option value="LIAB">LIAB - Linguistics/Arabic            </option><option value="LIFR">LIFR - Linguistics/French            </option><option value="LIGN">LIGN - Linguistics/General           </option><option value="LIGM">LIGM - Linguistics/German            </option><option value="LIHL">LIHL - Linguistics/Heritage Languages</option><option value="LIIT">LIIT - Linguistics/Italian           </option><option value="LIPO">LIPO - Linguistics/Portuguese        </option><option value="LISP">LISP - Linguistics/Spanish           </option><option value="LTCH">LTCH - Literature/Chinese            </option><option value="LTCO">LTCO - Literature/Comparative        </option><option value="LTCS">LTCS - Literature/Cultural Studies   </option><option value="LTEU">LTEU - Literature/European &amp; Eurasian</option><option value="LTFR">LTFR - Literature/French             </option><option value="LTGM">LTGM - Literature/German             </option><option value="LTGK">LTGK - Literature/Greek              </option><option value="LTIT">LTIT - Literature/Italian            </option><option value="LTKO">LTKO - Literature/Korean             </option><option value="LTLA">LTLA - Literature/Latin              </option><option value="LTRU">LTRU - Literature/Russian            </option><option value="LTSP">LTSP - Literature/Spanish            </option><option value="LTTH">LTTH - Literature/Theory             </option><option value="LTWR">LTWR - Literature/Writing            </option><option value="LTEN">LTEN - Literatures in English        </option><option value="LTWL">LTWL - Literatures of the World      </option><option value="LTEA">LTEA - Literatures/East Asian        </option><option value="MMW ">MMW  - Making of the Modern World    </option><option value="MBC ">MBC  - MarineBiodiversity&amp;Conservatn </option><option value="MATS">MATS - Materials Sci &amp; Engineering   </option><option value="MATH">MATH - Mathematics                   </option><option value="MSED">MSED - Mathematics &amp; Science Educ    </option><option value="MAE ">MAE  - Mechanical &amp; Aerospace Engin  </option><option value="MUIR">MUIR - Muir College                  </option><option value="MCWP">MCWP - Muir College Writing Program  </option><option value="MUS ">MUS  - Music                         </option><option value="NANO">NANO - NanoEngineering               </option><option value="PHAR">PHAR - Pharmacology                  </option><option value="SPPS">SPPS - Pharmacy                      </option><option value="PHIL">PHIL - Philosophy                    </option><option value="PHYS">PHYS - Physics                       </option><option value="POLI">POLI - Political Science             </option><option value="PSYC">PSYC - Psychology                    </option><option value="MGT ">MGT  - Rady School of Management     </option><option value="RELI">RELI - Religion, Study of            </option><option value="REV ">REV  - Revelle College               </option><option value="SDCC">SDCC - San Diego Community College   </option><option value="SIOC">SIOC - Scripps Inst of Oceanogr/COAP </option><option value="SIOG">SIOG - Scripps Inst of Oceanogr/GEO  </option><option value="SIOB">SIOB - Scripps Inst of Oceanogr/OBP  </option><option value="SIO ">SIO  - Scripps Inst of Oceanography  </option><option value="SXTH">SXTH - Sixth College                 </option><option value="SOCG">SOCG - Soc/Graduate                  </option><option value="SOCE">SOCE - Soc/Ind Research &amp; Honors Prog</option><option value="SOCI">SOCI - Sociology                     </option><option value="SE  ">SE   - Structural Engineering        </option><option value="TDAC">TDAC - Theatre / Acting              </option><option value="TDDE">TDDE - Theatre / Design              </option><option value="TDDR">TDDR - Theatre / Directing&amp;Stage Mgmt</option><option value="TDGE">TDGE - Theatre / General             </option><option value="TDGR">TDGR - Theatre / Graduate            </option><option value="TDHT">TDHT - Theatre / History &amp; Theory    </option><option value="TDPW">TDPW - Theatre / Playwriting         </option><option value="TDPR">TDPR - Theatre Dance/Practicum       </option><option value="TWS ">TWS  - Third World Studies           </option><option value="TMC ">TMC  - Thurgood Marshall College     </option><option value="USP ">USP  - Urban Studies &amp; Planning      </option><option value="VIS ">VIS  - Visual Arts                   </option><option value="WARR">WARR - Warren College                </option><option value="WCWP">WCWP - Warren College Writing Program</option></select>', "html.parser")
	
	dept_soup = get_soup(DEPARTMENT_LIST_URL, br)
	working = dept_soup.find(id="selectedSubjects")
	print working
	
	dept_list = [ str(dept['value']) for dept in soup1.find_all('option')]
	return dept_list

# ========================================
# Purpose: Gets CAPE Data for a
# 		   specified department
# ======================================== 
def get_cape_data_for_dept(dept, br):
	# gets soup
	soup = get_soup(BASE_URL+dept, br)
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

		# enter data into dictionary
		entry = {
			'instructor': instructor,
			'course': course,
			'term': term,
			'enroll': enroll,
			'evals': evals,
			'rcmndclass': rcmndclass,
			'rcmndinstr': rcmndinstr,
			'hrsperwk': hrsperwk,
			'gradeexp': gradeexp,
			'graderec': graderec
		}
		
		# add entry to list
		cape_data.append(entry)

		row = row.next_sibling
		# Debug
		# row_num = row_num + 1;
		# print row_num
	return cape_data

# initialize virtual browser
br = get_virtual_browser()

print 'started browser'

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
departments = get_departments(br)

# get capes for each department
for dept in departments:
 	cape_data = get_cape_data_for_dept(dept, br)
 	capes_by_departments[dept] = cape_data

# output to fat ass json file
with open('cape_data.json', 'w') as fp:
    json.dump(capes_by_departments, fp)