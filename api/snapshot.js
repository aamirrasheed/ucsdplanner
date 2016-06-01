exports.post = function(request, response) {
    var numSnapshots = request.body.snapshots.length;
    var snaps = [];
    var params = [];
    for (var i = 0; i < numSnapshots; i++) {
        snaps.push("(?,?,?,?,?,?,?)");
        params.push(request.body.snapshots[i].section_id);
        params.push(request.body.snapshots[i].term_name);
        params.push(request.body.snapshots[i].term_id);
        params.push(request.body.snapshots[i].date);
        params.push(request.body.snapshots[i].seats_avail);
        params.push(request.body.snapshots[i].seats_total);
        params.push(request.body.snapshots[i].waitlist);
    }
    var string = snaps.join();
    var sql = "set nocount on; insert into course_snapshot_info (section_id, term_name, term_id, date, seats_avail, seats_total, waitlist) values " + string + ";";
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /snapshot error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};