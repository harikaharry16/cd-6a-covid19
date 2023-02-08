const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    process.exit(1);
  }
};
initialDBAndServer();

//API 1

app.get("/states/", async (request, response) => {
  const getQuery = `SELECT * FROM state ;`;
  const statesArray = await db.all(getQuery);
  //console.log(statesArray);
  const convertObj = (each) => {
    return {
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    };
  };

  response.send(statesArray.map((each) => convertObj(each)));
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getReqQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;

  const stateDetails = await db.get(getReqQuery);
  //console.log(stateDetails);
  response.send({
    stateId: stateDetails.state_id,
    stateName: stateDetails.state_name,
    population: stateDetails.population,
  });
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const insertQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
                VALUES (
                    '${districtName}',
                    ${stateId},
                    ${cases},
                    ${cured},
                    ${active},
                    ${deaths});`;

  const updatedDistrict = await db.run(insertQuery);

  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;

  const districtDetails = await db.get(getDistrictQuery);

  response.send({
    districtId: districtDetails["district_id"],
    districtName: districtDetails["district_name"],
    stateId: districtDetails["state_id"],
    cases: districtDetails["cases"],
    cured: districtDetails["cured"],
    active: districtDetails["active"],
    deaths: districtDetails["deaths"],
  });
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `DELETE FROM district WHERE district_id = ${districtId};`;

  await db.run(deleteQuery);

  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `UPDATE district SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE district_id = ${districtId};`;

  await db.run(addDistrictQuery);

  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const grpStateStatsQuery = `SELECT  
            SUM(cases) ,
            SUM(cured) ,
            SUM(active) ,
            SUM(deaths) 
       FROM district
       WHERE state_id = ${stateId} ;`;

  const stats = await db.get(grpStateStatsQuery);
  //console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const detailsQuery = `
    SELECT 
       state_name
    FROM
       state NATURAL JOIN district
    WHERE 
       district_id = ${districtId};
       `;

  const details = await db.get(detailsQuery);
  console.log(details);

  response.send({
    stateName: details["state_name"],
  });
});
module.exports = app;
