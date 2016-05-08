from bs4 import BeautifulSoup
import requests
import re

# all acronyms for the sites we are using
#sites = ['AIP','AASM','ANTH','AUDL','BENG','BIOI''BIOL','BIOM','CHEM','CHIN','CLAS','CLIN','CLRE','COGS','COMM','CSE','CONT','CGS','CAT','DOC','ECON','EDS','ERC','SOE','ECE','ENVR','ESYS','ETHN','FMPH','FILM','GHP','GPS','LHCO','HLAW','HIST','HDP','HR','HUM','IMSM','INTL','JAPN','JUDA','LATI','LAWS','LING','LIT','MMW','RSM','MBC','MATS','MATH','MSED','MAE','MCWP','MUS','NANO','NEU','PHIL','PHYS','POLI','PSYC','RELI','REV','SCIS','SIO','SXTH','SOC','SE','THEA','TWS','TMC','USP','VIS','WARR']
sites = ["CSE"]

# loop through all sites
for currentsite in sites:
    response = requests.get('http://ucsd.edu/catalog/courses/' + currentsite + '.html')
    soup = BeautifulSoup(response.text, "html.parser")
    # get list of all classnames for site
    classnames = soup.find_all("p", { "class":"course-name"})
    for p_tag in classnames: # iterate through names
        # nexttext is description/prerequisites
        nexttext = p_tag.find_next("p")
        # check if there is a prerequistes listing
        if "Prerequisites: " in nexttext.text:
            # split into description and prerequisites
            description2, preqs2 = nexttext.text.encode("utf-8").split("Prerequisites: ",1)
            # replace wierd characters
            preqs = preqs2.replace("\xe2\x80\x99","'")
            description = description2.replace("\xe2\x80\x99","'")
            preqs = preqs2.replace("\t","")
            description = description2.replace("\t","")
        else:
            # case where there are no prerequisites
            description2 = nexttext.text.encode("utf-8")
            description = description2.replace("\xe2\x80\x99","'")
            description = description2.replace("\t","")
        # handle actual class name,units,course ID by splitting string
        if "(" in p_tag.text:
            if "." in p_tag.text:
                # get course ID
                courseID, rest = p_tag.text.encode("utf-8").split(".",1)
                # name of clss
                name, blah = rest.split("(",1)
                # number of units
                units2, empty = blah.split(")",1)
                units = units2.replace("\xe2\x80\x93","-")
                # check if course ID is lkke CSE 101 or just 171 
                if courseID[0].isdigit():
                    info = {'course_id': currentsite.strip() + courseID.strip(),'course_name': name.strip() ,'units': units.strip(),'description':description.strip(),'prereqs':preqs.strip()}
                else:
                    info = {'course_id': "".join(courseID.split(" ")), 'course_name': name.strip(), 'units': units.strip(), 'description':description.strip(), 'prereqs':preqs.strip()}
        # case where no units for course
        elif "." in p_tag.text:
            courseID, name = p_tag.text.encode("utf-8").split(".",1)
            if(courseID[0].isdigit()):
                info = {'course_id': currentsite.strip() + courseID.strip(),'course_name': name.strip() ,'units': units.strip(),'description':description.strip(),'prereqs':preqs.strip()}
            else:
                info = {'course_id': "".join(courseID.split(" ")), 'course_name': name.strip(), 'units': units.strip(), 'description':description.strip(), 'prereqs':preqs.strip()}
        r = requests.post("https://ucsdplanner-api.azure-mobile.net/api/catalog", info)
        try:
            r.raise_for_status()
        except requests.exceptions.HTTPError:
            print("Error talking to server")
            break
#weightMatrix has all the info we need
#Decription, Prerequisites, Units, Course ID, Title for all the class info
