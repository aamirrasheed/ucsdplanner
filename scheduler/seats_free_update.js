function seats_free_update() {
    var discussionTable = tables.getTable('course_section_discussions');
    var discProsId = [];
    var sectionId = [];
    var seatsInSec = [];
    discussionTable.read({
        success: function(discussions) {
            // Update from discussion to section
            for (var i = 0; i < discussions.length; i++) {
                var d = discussions[i];
                var loc = discProsId.indexOf(d.id);
                // if not there
                if (loc < 0) {
                    discProsId.push(d.id);
                    // get section id
                    var secLoc = sectionId.indexOf(d.section_id);
                    // if not present, insert
                    if (secLoc < 0) {
                        seatsInSec.push(d.disc_seats_avail);
                        sectionId.push(d.section_id);
                    }
                    else {
                        if (d.disc_seats_avail > 0)
                            seatsInSec[secLoc] += d.disc_seats_avail;
                    }                   
                }        
            }
            
            var insert = "";
            // courses.length
            for (var j = 0; j < sectionId.length; j++) {
                insert += " when course_section.id = '" + String(sectionId[j]) + "' then " + String(seatsInSec[j]) + " ";
            }
            var sql = "update course_section set course_section.sec_seats_avail = case "+ insert + " end where course_section.id in ('" + sectionId.join("', '") + "');";
                mssql.query(sql, {
                    success:function(results) {
                        setSectionSeats();
                    },
                    error: function(results) {
                        console.error(results);
                    }
                });
            
        }
    }); 
    
    

function setSectionSeats() {
    var sectionTable = tables.getTable('course_section');
    var secProsId = [];
    var courseId = [];
    var seatsInCourse = [];
    sectionTable.read({
        success: function(sections) {
            // Update from discussion to section
            for (var i = 0; i < sections.length; i++) {
                var s = sections[i];
                var loc = secProsId.indexOf(s.id);
                // if not there
                if (loc < 0) {
                    secProsId.push(s.id);
                    // get section id
                    var courseLoc = courseId.indexOf(s.course_id);
                    // if not present, insert
                    if (courseLoc < 0) {
                        seatsInCourse.push(s.sec_seats_avail);
                        courseId.push(s.course_id);
                    }
                    else {
                        if (s.sec_seats_avail > 0)
                            seatsInCourse[courseLoc] += s.sec_seats_avail;
                    }                   
                }        
            }
            
            var insert = "";
            // courses.length
            for (var j = 0; j < courseId.length; j++) {
                insert += " when course.id = '" + String(courseId[j]) + "' then " + String(seatsInCourse[j]) + " ";
            }
            var sql = "update course set course.seats_avail = case "+ insert + " end where course.id in ('" + courseId.join("', '") + "');";
            
                mssql.query(sql, {
                    success:function(results) {
                    },
                    error: function(results) {
                        console.error(results);
                    }
                });
            
        }
    }); 
}
}