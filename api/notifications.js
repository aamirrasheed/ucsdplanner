exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into notifications (course_id, user_email, full_notif, percent_notif, notif_freq) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.course_id, request.body.user_email, request.body.full_notif, request.body.percent_notif, request.body.notif_freq];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /notifications error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};
