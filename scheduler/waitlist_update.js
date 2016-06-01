function waitlist_update() {
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
                        if (d.disc_waitlist >= 0) {
                            seatsInSec.push(d.disc_waitlist);
                            sectionId.push(d.section_id);
                        }
                    }
                    else {
                        if (d.disc_waitlist > 0)
                            seatsInSec[secLoc] += d.disc_waitlist;
                    }                   
                }        
            }
            
            
            var insert = "";
            // courses.length
            for (var j = 0; j < sectionId.length; j++) {
                insert += " when course_section.id = '" + String(sectionId[j]) + "' then " + String(seatsInSec[j]) + " ";
            }
            var sql = "update course_section set course_section.sec_waitlist = case "+ insert + " end where course_section.id in ('" + sectionId.join("', '") + "');";
            console.log("SQL 1 : " + sql);
                mssql.query(sql, {
                    success:function(results) {
                        setCourse();
                    },
                    error: function(results) {
                        console.error(results);
                    }
                });
            
        }
    }); 
    
    

function setCourse() {
    var sectionTable = tables.getTable('course_section');
    var courseId = [];
    var seatsInCourse = [];
    sectionTable.read({
        success: function(sections) {
            // Update from discussion to section
            for (var i = 0; i < sections.length; i++) {
                var s = sections[i];
                    // get section id
                    var courseLoc = courseId.indexOf(s.course_id);
                    // if not present, insert
                    if (courseLoc < 0 && s.sec_waitlist >=0) {
                        seatsInCourse.push(s.sec_waitlist);
                        courseId.push(s.course_id);
                    }
                    else {
                        if (s.sec_waitlist > 0)
                            seatsInCourse[courseLoc] += s.sec_waitlist;
                    }                   
                 
            }
            
            var insert = "";
            // courses.length
            for (var j = 0; j < courseId.length; j++) {
                insert += " when course.id = '" + String(courseId[j]) + "' then " + String(seatsInCourse[j]) + " ";
            }
            var sql = "update course set course.waitlist = case "+ insert + " end where course.id in ('" + courseId.join("', '") + "');";
            console.log("sql 2 : " + sql);
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