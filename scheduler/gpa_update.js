function gpa_update() {
    var capeTable = tables.getTable('prof_cape_info');
    var courses = [];
    var gpa = [];
    var numHits = [];
    console.log("Got here");
    capeTable.read({
        success:function(cape) {
            for (var i = 0; i< cape.length; i++) {
                var c = cape[i];
                var loc = courses.indexOf(c.course_id);
                if (loc < 0) {
                    if (c.cape_prof_gpa >= 0) {
                        courses.push(c.course_id);
                        gpa.push(c.cape_prof_gpa);
                        numHits.push(c.cape_num_evals);
                    }
                }
                else {
                    if (c.cape_prof_gpa >= 0) {
                        gpa[loc] = (c.cape_prof_gpa * c.cape_num_evals + gpa[loc]*numHits[loc]) / (numHits[loc] + c.cape_num_evals);
                        numHits[loc] += c.cape_num_evals;
                    }
                }
            }
            var insert = "";
            // courses.length
            for (var j = 0; j < courses.length; j++) {
                insert += " when course.catalog_course_id = '" + String(courses[j]) + "' then " + String(Math.round(gpa[j])) + " ";
            }
            var sql = "update course set course.avg_gpa = case "+ insert + " end where course.catalog_course_id in ('" + courses.join("', '") + "');";
            console.log(sql);
                 mssql.query(sql,  {
                    success:function(results) {
                                    console.log("DONE");
                    },
                    error: function(results) {
                        console.error(results);
                    }
                });
        },
        error: function(cape) {
            console.log("NOPE");
        }

    });
}
