// Load data from JSON file
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    // Initial data
    var data = data;

    // Calculate average change in power consumption
    var totalChange = 0;
    for (var i = 1; i < data.length; i++) {
      totalChange += data[i].y - data[i - 1].y;
    }
    var averageChange = totalChange / (data.length - 1);

    // Generate predicted data
    var predictedData = [];
    var lastDataPoint = data[data.length - 1];
    var lastDate = luxon.DateTime.fromISO(lastDataPoint.x);
    var lastPower = lastDataPoint.y;
    for (var i = 1; i <= 7; i++) {
      var nextDate = lastDate.plus({ days: i });
      var nextPower = lastPower + averageChange;
      predictedData.push({ x: nextDate.toISO(), y: nextPower });
      lastPower = nextPower; // Update lastPower for the next iteration
    }

    // Chart configuration
    var ctx = document.getElementById("powerChart").getContext("2d");
    var chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Потребляемая мощность",
            data: data,
            borderColor: "red",
            fill: false
          },
          {
            label: "Прогнозируемая потребляемая мощность",
            data: predictedData,
            borderColor: "blue",
            fill: false,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              tooltipFormat: "yyyy-MM-dd HH:mm",
              displayFormats: {
                hour: "HH:mm",
                day: "MMM dd"
              }
            },
            title: {
              display: true,
              text: "Date"
            }
          },
          y: {
            title: {
              display: true,
              text: "Power (kW)"
            }
          }
        }
      }
    });

    // Handle form submission
    document
      .getElementById("addDataForm")
      .addEventListener("submit", function (event) {
        event.preventDefault();
        var powerInput = document.getElementById("powerInput");
        var power = parseFloat(powerInput.value);
        if (!isNaN(power)) {
          var now = luxon.DateTime.local();
          data.push({ x: now.toISO(), y: power });
          chart.update();

          // Update data.json file using GitHub API
          var jsonData = JSON.stringify(data, null, 2);
          updateDataFile(jsonData);

          powerInput.value = "";
        }
      });
  })
  .catch((error) => console.error(error));

// Function to update data.json file using GitHub API
function updateDataFile(jsonData) {
  var url = "https://api.github.com/repos/i5anin/power/contents/data.json";
  var token = process.env.GITHUB_TOKEN;
  var branch = "main";
  var commitMessage = "Update data.json";

  var requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  };

  // Get the current SHA of data.json file
  fetch(url, requestOptions)
    .then((response) => response.json())
    .then((data) => {
      var sha = data.sha;

      // Update data.json file
      requestOptions.method = "PUT";
      requestOptions.body = JSON.stringify({
        message: commitMessage,
        content: btoa(jsonData),
        sha: sha,
        branch: branch
      });

      fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    })
    .catch((error) => console.error(error));
}
