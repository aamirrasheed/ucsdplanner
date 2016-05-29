window.onload = function() {
  var ctx = document.getElementById("grade-dist-chart").getContext("2d");
  var myPieChart = new Chart(ctx,{
    type: 'pie',
    data: data,
    options: options
  });
};
var data = {
    labels: [
        "A (17%)",
        "B (18%)",
        "C (23%)",
        "D (39%)",
        "F (3%)"
    ],
    datasets: [
        {
            data: [17, 18, 23, 39, 3],
            backgroundColor: [
                "#A7DBD8",
                "#FA6900",
                "#E0E4CC",
                "#F38630",
                "#69D2E7"
            ],
            hoverBackgroundColor: [
                "#A7DBD8",
                "#FA6900",
                "#E0E4CC",
                "#F38630",
                "#69D2E7"
            ]
        }]
};
var options = {
    responsive: true,
    cutoutPercentage: 0
};