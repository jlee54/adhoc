import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...
function retrieve(options  = {})
{
  const records_per_page = 10;

  // Construct URL String
  let uri = URI(window.path);
  uri.addSearch("limit", records_per_page);

  let requested_page = 1;
  if (Object.keys(options).length > 0) {
    if (options.page) {
      requested_page = options.page;
      const offset = (options.page * records_per_page) - records_per_page;
      uri.addSearch("offset", offset);
    }

    if (options.colors) {
      const colors = options.colors;
      uri.addSearch("color[]", colors);
    }
  }

  // Make Records Request
  let string_uri = uri.toString();
  return fetch(string_uri)
    .then(response => response.json())
    .then(records => {
        let response = {};
        const primary_colors = ["red", "blue", "yellow"];

        let ids = [];
        let opens = [];
        let closed_counter = 0;
        for (let key in records) {
          let obj = records[key];
          ids.push(obj.id);

          obj.isPrimary = primary_colors.includes(obj.color);

          if (obj.disposition === "open") {
            opens.push(obj);
          } else if (obj.isPrimary) {
            closed_counter += 1;
          }
        }

        response.ids = ids;
        response.open = opens;
        response.closedPrimaryCount = closed_counter;

        // Determine Previous Page
        if (requested_page > 1) {
          response.previousPage = requested_page - 1;
        } else {
          response.previousPage = null;
        }

        // Determine Next Page
        if (response.previousPage === null) {
          if (response.ids.length > 0) {
            response.nextPage = 2;
          } else {
            response.nextPage = null;
          }
          return response;
        } else {
          return getLastPage(records_per_page)
            .then(last_page => {
              if (response.previousPage + 1 >= last_page) {
                response.nextPage = null;
              } else {
                response.nextPage = response.previousPage + 2;
              }
              return response;
            });
        }
    })
    .catch(err => console.log("Received error processing this request."));
}

// Determine Last Possible Page
function getLastPage(records_per_page)
{
  let records_uri = URI(window.path);
  records_uri.addSearch("limit", Number.MAX_SAFE_INTEGER);
  let records_string_uri = records_uri.toString();
  return fetch(records_string_uri)
    .then(response => response.json())
    .then(records => {
      let record_count = Object.keys(records).length;
      let last_page = Math.round(record_count/records_per_page);
      return last_page;
    });
}

export default retrieve;
