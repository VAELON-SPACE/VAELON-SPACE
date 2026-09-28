// Region: North Bay wildfire corridor, California (Sonoma, Napa, Marin, Solano,
// Mendocino, and Lake counties).
//
// Why this region: real, named, and one of the most wildfire-prone areas in the U.S.
// (2017 Tubbs Fire, 2018 Mendocino Complex Fire - the largest fire in California history
// at the time, 2019 Kincade Fire, 2020 Glass Fire, 2020 LNU Lightning Complex Fire, 2015
// Valley Fire), with real hospitals and real open facility data to build on - see
// "What's real vs. modeled" in README.md.
//
// FACILITY DATA PROVENANCE (checked against California HCAI facility records / public
// hospital profiles):
//   Sonoma County:
//   - Santa Rosa Memorial Hospital: 338 licensed beds, Level II Trauma Center.
//     Source: Providence Health / HCAI. https://hcai.ca.gov/
//   - Kaiser Permanente Santa Rosa Medical Center: 173 licensed beds.
//     Source: HCAI facility record ("Kaiser Foundation Hospital - Santa Rosa").
//   - Petaluma Valley Hospital: 80 licensed beds. HCAI ID 106491001.
//     Source: hcai.ca.gov/facility/petaluma-valley-hospital/
//   - Sonoma Valley Hospital: 51 licensed beds. HCAI ID 106491076.
//     Source: hcai.ca.gov/facility/sonoma-valley-hospital/
//   - Healdsburg Hospital: 38 licensed beds. HCAI ID 106490964.
//     Source: hcai.ca.gov/facility/healdsburg-hospital/
//   Napa County:
//   - Providence Queen of the Valley Medical Center (Napa): 198 licensed beds, Level III
//     Trauma Center. HCAI ID 106281047. Source: hcai.ca.gov/facility/queen-of-the-valley-medical-center
//   Marin County:
//   - MarinHealth Medical Center (Greenbrae): 327 licensed beds, Level III Trauma Center.
//     HCAI ID 106211006. Source: hcai.ca.gov/facility/marinhealth-medical-center/
//   - Novato Community Hospital: 47 licensed beds. HCAI ID 106214034.
//     Source: hcai.ca.gov/facility/novato-community-hospital/
//   Solano County:
//   - NorthBay Medical Center (Fairfield): 154 licensed beds. HCAI ID 106481357.
//     Source: hcai.ca.gov/facility/north-bay-medical-center
//   - Sutter Solano Medical Center (Vallejo): 106 licensed beds.
//     Source: Sutter Health / Wikipedia (HCAI ID 106481472, general acute care).
//   Mendocino County:
//   - Adventist Health Ukiah Valley: 50 licensed beds. HCAI ID 106231396.
//     Source: adventisthealth.org/ukiah-valley/about-us/
//   Lake County:
//   - Sutter Lakeside Hospital (Lakeport): 27 licensed beds, Critical Access Hospital.
//     HCAI ID 106171395. Source: hcai.ca.gov/facility/sutter-lakeside-hospital/
//   Coordinates are geocoded to each facility's public street address at city-level
//   precision (accurate enough for OSRM road routing; not survey-grade).
//   Populations are 2020 U.S. Census figures for each city (Greenbrae is an unincorporated
//   CDP, not an incorporated city; its population figure is the CDP total).
//
// WHAT IS NOT REAL: `teams`, `ambulances`, and `kits` on every hub below. None of these
// counties publish a public, live registry of how many response teams, ambulances, or
// medical kits are staged at a given hospital at a given moment - that is operational EMS
// data, not open data. Rather than invent standalone numbers, we derive them from each
// hospital's real licensed bed count using a fixed, documented ratio (see
// deriveOperationalCapacity below). That is still a model assumption, not a measurement -
// it should be replaced with real county EMS agency fleet data before this is used for
// anything beyond a demo.
function deriveOperationalCapacity(beds) {
  return {
    teams: Math.round(beds * 0.12),
    ambulances: Math.round(beds * 0.07),
    kits: Math.round(beds * 9)
  };
}

const cities = [
  {
    id: "santa-rosa",
    name: "Santa Rosa",
    country: "USA",
    lat: 38.4404,
    lon: -122.7141,
    population: 178127,
    // Rodgers Creek Fault runs directly under Santa Rosa; the 2017 Tubbs Fire burned
    // into the city's northern neighborhoods (Coffey Park, Fountaingrove).
    risk: { earthquake: 0.55, flood: 0.28, storm: 0.22, wildfire: 0.82 },
    hubs: [
      {
        id: "santa-rosa-memorial",
        name: "Santa Rosa Memorial Hospital",
        lat: 38.4436,
        lon: -122.7014,
        beds: 338,
        traumaLevel: "Level II Trauma Center",
        bedsSource: "Providence Health / HCAI facility record",
        ...deriveOperationalCapacity(338)
      },
      {
        id: "kaiser-santa-rosa",
        name: "Kaiser Permanente Santa Rosa Medical Center",
        lat: 38.4719,
        lon: -122.7053,
        beds: 173,
        traumaLevel: "General Acute Care",
        bedsSource: "HCAI facility record (Kaiser Foundation Hospital - Santa Rosa)",
        ...deriveOperationalCapacity(173)
      }
    ]
  },
  {
    id: "petaluma",
    name: "Petaluma",
    country: "USA",
    lat: 38.2324,
    lon: -122.6367,
    population: 59776,
    risk: { earthquake: 0.42, flood: 0.34, storm: 0.24, wildfire: 0.38 },
    hubs: [
      {
        id: "petaluma-valley",
        name: "Petaluma Valley Hospital",
        lat: 38.2453,
        lon: -122.6363,
        beds: 80,
        traumaLevel: "General Acute Care",
        bedsSource: "HCAI facility record, ID 106491001",
        ...deriveOperationalCapacity(80)
      }
    ]
  },
  {
    id: "sonoma",
    name: "Sonoma",
    country: "USA",
    lat: 38.2919,
    lon: -122.458,
    population: 11147,
    risk: { earthquake: 0.4, flood: 0.24, storm: 0.2, wildfire: 0.7 },
    hubs: [
      {
        id: "sonoma-valley",
        name: "Sonoma Valley Hospital",
        lat: 38.2915,
        lon: -122.4577,
        beds: 51,
        traumaLevel: "General Acute Care, Basic ER",
        bedsSource: "HCAI facility record, ID 106491076",
        ...deriveOperationalCapacity(51)
      }
    ]
  },
  {
    id: "healdsburg",
    name: "Healdsburg",
    country: "USA",
    lat: 38.6105,
    lon: -122.8692,
    population: 11340,
    // Healdsburg is the closest hospital town to where the 2019 Kincade Fire ignited
    // (near The Geysers, northeast of Geyserville).
    risk: { earthquake: 0.38, flood: 0.3, storm: 0.22, wildfire: 0.88 },
    hubs: [
      {
        id: "healdsburg-hospital",
        name: "Healdsburg Hospital",
        lat: 38.6168,
        lon: -122.8676,
        beds: 38,
        traumaLevel: "Critical Access Hospital",
        bedsSource: "HCAI facility record, ID 106490964",
        ...deriveOperationalCapacity(38)
      }
    ]
  },
  {
    id: "napa",
    name: "Napa",
    country: "USA",
    lat: 38.2975,
    lon: -122.2869,
    population: 80506,
    // The 2017 Atlas Fire and 2020 Glass Fire both burned into Napa County's eastern
    // hillsides; the 2014 South Napa earthquake (M6.0) is the county's largest in decades.
    risk: { earthquake: 0.5, flood: 0.3, storm: 0.22, wildfire: 0.78 },
    hubs: [
      {
        id: "queen-of-the-valley",
        name: "Providence Queen of the Valley Medical Center",
        lat: 38.3187,
        lon: -122.2864,
        beds: 198,
        traumaLevel: "Level III Trauma Center",
        bedsSource: "HCAI facility record, ID 106281047",
        ...deriveOperationalCapacity(198)
      }
    ]
  },
  {
    id: "greenbrae",
    name: "Greenbrae",
    country: "USA",
    lat: 37.9469,
    lon: -122.5361,
    population: 10825,
    // Marin's bay-facing towns carry meaningful flood/storm-surge exposure; wildfire risk
    // is real but lower than the more inland wine-country counties.
    risk: { earthquake: 0.48, flood: 0.4, storm: 0.3, wildfire: 0.42 },
    hubs: [
      {
        id: "marinhealth-medical-center",
        name: "MarinHealth Medical Center",
        lat: 37.9474,
        lon: -122.5359,
        beds: 327,
        traumaLevel: "Level III Trauma Center",
        bedsSource: "HCAI facility record, ID 106211006",
        ...deriveOperationalCapacity(327)
      }
    ]
  },
  {
    id: "novato",
    name: "Novato",
    country: "USA",
    lat: 38.1074,
    lon: -122.5697,
    population: 53225,
    risk: { earthquake: 0.46, flood: 0.32, storm: 0.26, wildfire: 0.5 },
    hubs: [
      {
        id: "novato-community",
        name: "Novato Community Hospital",
        lat: 38.1046,
        lon: -122.561,
        beds: 47,
        traumaLevel: "General Acute Care",
        bedsSource: "HCAI facility record, ID 106214034",
        ...deriveOperationalCapacity(47)
      }
    ]
  },
  {
    id: "fairfield",
    name: "Fairfield",
    country: "USA",
    lat: 38.2494,
    lon: -122.04,
    population: 119881,
    // Fairfield sits inside the 2020 LNU Lightning Complex Fire perimeter's eastern edge.
    risk: { earthquake: 0.34, flood: 0.26, storm: 0.24, wildfire: 0.55 },
    hubs: [
      {
        id: "northbay-medical-center",
        name: "NorthBay Medical Center",
        lat: 38.2536,
        lon: -122.0498,
        beds: 154,
        traumaLevel: "General Acute Care",
        bedsSource: "HCAI facility record, ID 106481357",
        ...deriveOperationalCapacity(154)
      }
    ]
  },
  {
    id: "vallejo",
    name: "Vallejo",
    country: "USA",
    lat: 38.1041,
    lon: -122.2566,
    population: 126090,
    risk: { earthquake: 0.36, flood: 0.3, storm: 0.24, wildfire: 0.4 },
    hubs: [
      {
        id: "sutter-solano",
        name: "Sutter Solano Medical Center",
        lat: 38.1157,
        lon: -122.2408,
        beds: 106,
        traumaLevel: "General Acute Care",
        bedsSource: "Sutter Health / HCAI facility record",
        ...deriveOperationalCapacity(106)
      }
    ]
  },
  {
    id: "ukiah",
    name: "Ukiah",
    country: "USA",
    lat: 39.1502,
    lon: -123.2078,
    population: 16607,
    // Mendocino County was at the center of the 2018 Mendocino Complex Fire, the largest
    // wildfire in California history at the time it burned.
    risk: { earthquake: 0.3, flood: 0.28, storm: 0.22, wildfire: 0.8 },
    hubs: [
      {
        id: "adventist-health-ukiah-valley",
        name: "Adventist Health Ukiah Valley",
        lat: 39.1362,
        lon: -123.1936,
        beds: 50,
        traumaLevel: "General Acute Care",
        bedsSource: "HCAI facility record, ID 106231396",
        ...deriveOperationalCapacity(50)
      }
    ]
  },
  {
    id: "lakeport",
    name: "Lakeport",
    country: "USA",
    lat: 39.043,
    lon: -122.9166,
    population: 4753,
    // Lake County has burned repeatedly and severely: the 2015 Valley Fire, 2015 Rocky
    // Fire, and 2018 Mendocino Complex Fire all struck this county within a few years.
    risk: { earthquake: 0.28, flood: 0.22, storm: 0.2, wildfire: 0.9 },
    hubs: [
      {
        id: "sutter-lakeside",
        name: "Sutter Lakeside Hospital",
        lat: 39.0398,
        lon: -122.8986,
        beds: 27,
        traumaLevel: "Critical Access Hospital",
        bedsSource: "HCAI facility record, ID 106171395",
        ...deriveOperationalCapacity(27)
      }
    ]
  }
];

module.exports = { cities };
