var twilio = require('twilio');

function notifications() {

    var client = new twilio.RestClient('AC5f662065a4775de95c574227f01bd860', 'f44940814b2b25551faa0bff7343e8cf');

  
        client.sendSms({
            to: '6308815869',
            from:'+13312155815',
            body: 'bruh'
        }, function(error, message) {

            // The "error" variable will contain error information, if any.
            // If the request was successful, this value will be "false"
            if (!error) {
            }
            else {
                console.log("OMG YOU DONE MESSED UP");
            }
        });


}