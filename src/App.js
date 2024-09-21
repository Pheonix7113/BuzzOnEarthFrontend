import React, { useEffect,useState } from 'react';
import EvStation from './EvStation';  // Component for EV Station Map
import HeatMapComponent from './HeatMapComponent';  // Component for Heatmap
import { 
  fetchPopulation, 
  fetchParking, 
  fetchEdges, 
  fetchEVStations ,
  fetchProbability
} from './fetchPop'; // Adjust the import as needed
import QuestionIcon from './question.png'; // Component for Question Icon
import ListItem from './ListItem';

const locations = [
  { position: [0.45, 51.47] },
  { position: [0.46, 51.48] },
  { position: [0.47, 51.49] }
];
const getScopeColor = (scope) => {
  if (scope > 80) {
    return 'green';
  } else if (scope > 60) {
    return 'yellow';
  } else if (scope > 40) {
    return 'orange';
  } else {
    return 'red';
  }
};
const cityData = new Map();

cityData.set("Frankfurt", { lat: 50.1109, lng: 8.6821 });
cityData.set("Munich", { lat: 48.1371, lng: 11.5761 });
cityData.set("Kaiserslautern", { lat: 49.4586, lng: 7.7496 });
cityData.set("Saarbrucken", { lat: 49.2343, lng: 6.9614 });
cityData.set("Stuttgart", { lat: 48.7823, lng: 9.1833 });
cityData.set("Karlsruhe", { lat: 49.0135, lng: 8.4041 });
cityData.set("Trier", { lat: 49.7527, lng: 6.6503 });
cityData.set("Mainz", { lat: 49.9975, lng: 8.2733 });
cityData.set("Berlin", { lat: 52.5200, lng: 13.4050 });


const App = () => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [populationMap, setPopulationMap] = useState(new Map());
  const [currentDensity , setCurrentDensity] = useState(0);
  const [hoveredStation, setHoveredStation] = useState(null); 
  const [filterText, setFilterText] = useState('');
  const [pinnedItems, setPinnedItems] = useState([]);
  const [selectedScopes, setSelectedScopes] = useState([]);
  // const [evStationPlacements , setEvStationPlacements] = useState();
  const [population, setPopulation] = useState(null);
  const [hoveredProbability, setHoveredProbability] = useState(null); // Add state for hovered probability
  const [comparisonResult, setComparisonResult] = useState(null); // State for comparison result
  const [parking, setParking] = useState(null);
  const [edges, setEdges] = useState(null);
  const [evStations, setEvStations] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [probability, setProbability] = useState([]);
  const [isAccordionOpen1, setIsAccordionOpen1] = useState(false);
  const [compareSearchText1, setCompareSearchText1] = useState('');
  const [compareSearchText2, setCompareSearchText2] = useState('');
  const [filteredStations1, setFilteredStations1] = useState([]);
  const [filteredStations2, setFilteredStations2] = useState([]);
  const [isInputFocused1, setIsInputFocused1] = useState(false);
  const [isInputFocused2, setIsInputFocused2] = useState(false);
  // const [cityData, setCityData] = useState({}); // State to store data from all endpoints


  useEffect(() => {
    console.log({ hoveredStation });
  }, [hoveredStation]);
  const endpoints =   [  
    'parking',
  'parking_space',
  'civic',
  'restaurant',
  'park',
  'school',
  'node',
  'Community_centre',
  'place_of_worship',
  'university',
  'cinema',
  'townhall',
  'retail',
  'commercial',
  'library',
  'population',
  'residential',
];


const [selectedCity, setSelectedCity] = useState('');
// const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']; // Example list of cities
const cities = ['Frankfurt', 'Munich', 'Kaiserslautern', 'Saarbrucken', 'Stuttgart', 'Karlsruhe', 'Trier', 'Mainz', 'Berlin']
let globalMap= {};

// Function to parse polygon data and update globalMap
function parseAndStoreInMap(data, endpoint) {
  const polygonString = data.geometry;
  const endpointNumber = data[endpoint];

  // Remove the "POLYGON" prefix and extra parentheses
  const cleanedString = polygonString.replace('POLYGON ((', '').replace('))', '');

  // Split the coordinates string into an array of points
  const coordinatesArray = cleanedString.split(', ').map(coord => {
    const [lng, lat] = coord.split(' ').map(Number); // Convert each pair to numbers
    return { lat, lng };
  });
  coordinatesArray.forEach(corner => {
    const key = `${corner.lat},${corner.lng}`;
    if (!globalMap[key]) {
      globalMap[key] = {}; // Initialize key if it doesn't exist
    }
    globalMap[key][endpoint] = endpointNumber;
  });
}

const createEvStationPlacements = (data, inn) => {
  if (!data || !data.geometry) {
    console.error("Invalid data or missing geometry property");
    return [];
  }

  const coordinatesString = data.geometry.slice(10, -2);
  if (!coordinatesString) {
    console.error("Invalid geometry format");
    return [];
  }

  const coordsArray = coordinatesString.split(", ");
  if (!coordsArray.length) {
    console.error("No coordinates found in geometry");
    return [];
  }

  const evStations = data.EV_stations;
  const placements = [];

  // Convert coordinates to number
  const coords = coordsArray.map(coord => coord.split(" ").map(Number));

  // Calculate the center of the polygon
  // const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
  // const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;

  // Generate EV station placements
  if (evStations === 1) {
    placements.push({ lat: coords[0][1], lng: coords[0][0], prob: probability[inn] });
  } else {
    // Distribute EV stations evenly within the polygon
    for (let i = 0; i < evStations; i++) {
      const lat = coords[i % coords.length][1];
      const lng = coords[i % coords.length][0];
      placements.push({ lat, lng, prob: probability[inn] });    }
  }
  // console.log({placements})
  return placements;
};


const evStationPlacements = evStations?.data?.flatMap((data, inn) => 
  createEvStationPlacements(data, inn, probability)
).map((placement, index) => ({
  ...placement,
  ind: index
}));

console.log({ evStationPlacements });


console.log({evStationPlacements})

const handleCityChange = (event) => {
  setSelectedCity(event.target.value);
};
const handleFilterChange = (event) => {
  setFilterText(event.target.value);
};

const filteredCities = cities.filter(city =>
  city.toLowerCase().includes(filterText.toLowerCase())
);

const fetchData = async (city) => {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/${endpoint}/${city}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${endpoint}`);
      }
      const result = await response.json();

      // Iterate through result and update the global map
      result.forEach(item => {
        parseAndStoreInMap(item, endpoint);
      });
    } catch (error) {
      console.error(error);
    }
  }
};

  useEffect(() => {
    if(selectedCity==='') return;

    const testEndpoints = async () => {
      const x = await fetchData(selectedCity);
      console.log({globalMap})
      
      // Testing population endpoint
      const populationResult = await fetchPopulation(selectedCity);
      setPopulation(populationResult);
      console.log({populationResult})
      // Testing parking endpoint
      const parkingResult = await fetchParking(selectedCity);
      setParking(parkingResult);
      
      const edgesResult = await fetchEdges(selectedCity);
      setEdges(edgesResult);
      // console.log({edgesResult})
      
      // Testing EV stations endpoint
      const evStationsResult = await fetchEVStations(selectedCity);
      setEvStations(evStationsResult);

      // You can add more fetches as needed...
      const probabilityResult = await fetchProbability(selectedCity);
      setProbability(probabilityResult); // Assuming you have a state variable for this
      console.log({ probabilityResult });
    };

    testEndpoints();
  }, [selectedCity]);

  const scopeOptions = [
    { label: '> 80%', color: 'bg-green-500' },
    { label: '60% - 80%', color: 'bg-yellow-500' },
    { label: '40% - 60%', color: 'bg-orange-500' },
    { label: '< 40%', color: 'bg-red-500' },
  ];

  const getPopulationDensity = (lat, lng) => {
    const key = `${lat},${lng}`;
    const x = populationMap?.get(key) 
    if(x) setCurrentDensity(x)
    return x || 'No data';
  };
  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleCheckboxChange = (label) => {
    setSelectedScopes((prevSelectedScopes) => {
      if (prevSelectedScopes.includes(label)) {
        return prevSelectedScopes.filter((item) => item !== label);
      } else {
        return [...prevSelectedScopes, label];
      }
    });
  };
  useEffect(()=>{
    compareStations(compareSearchText1,compareSearchText2);
  },[compareSearchText1,compareSearchText2])

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };
  const handleCityClick = (city) => {
    setSelectedCity(city);
    setFilterText(city);
    setIsInputFocused(false);
  };
  // const stations = [
  //   { name: 'Station 1', scope: 93.5 },
  //   { name: 'Station 2', scope: 75.4 },
  //   { name: 'Station 3', scope: 65.2 },
  //   { name: 'Station 4', scope: 45.1 },
  //   { name: 'Station 5', scope: 30.0 },
  //   // Add more stations as needed
  // ];

  useEffect(()=>{
    if(population == null || population.length===0) return;
    const extractLatLngPopulation = (population) => {
      const populationMap = new Map();
      console.log({population})
      population?.forEach((data) => {
        const coordinatesString = data.geometry.match(/\(\((.*)\)\)/)[1];
        const coordinatesArray = coordinatesString.split(', ').map(coord => {
          const [lng, lat] = coord.split(' ').map(Number);
          return { lat, lng };
        });
    
        const populationDensity = parseFloat(data.population);
    
        coordinatesArray?.forEach(coord => {
          const key = `${coord.lat},${coord.lng}`;
          populationMap.set(key, populationDensity);
        });
      });

      return populationMap;
    };
    const map = extractLatLngPopulation(population.data);
    const lat = 50.099822499999995;
    const lng = 8.4727605;
    const key = `${lat},${lng}`;
    const populationDensity = map.get(key);
    setPopulationMap(map);
    console.log({map})
    console.log(`Population density at (${lat}, ${lng}): ${populationDensity}`);
  },[population]);
  
  useEffect(()=>{
    console.log({populationMap})

  },[populationMap])
  useEffect(()=>{
    console.log({pinnedItems})
  },[pinnedItems])


  useEffect(() => {
    setFilteredStations1(
  evStationPlacements?.filter(station =>
    `station ${station.ind}`.toLowerCase().includes(compareSearchText1.toLowerCase())
  )
);
}, [compareSearchText1]);

useEffect(() => {
setFilteredStations2(
  evStationPlacements?.filter(station =>
    `station ${station.ind}`.toLowerCase().includes(compareSearchText2.toLowerCase())
  )
);
}, [compareSearchText2]);

const compareStations = () => {
  const index1 = parseInt(compareSearchText1.replace('station ', ''), 10);
  const index2 = parseInt(compareSearchText2.replace('station ', ''), 10);

  if (isNaN(index1) || isNaN(index2) || index1 < 0 || index2 < 0 || index1 >= evStationPlacements.length || index2 >= evStationPlacements.length) {
    setComparisonResult('Invalid station indices');
    return;
  }
  const station1 = evStationPlacements[index1];
  const station2 = evStationPlacements[index2];

  const population1 = getPopulationDensity(station1.lat, station1.lng);
  const population2 = getPopulationDensity(station2.lat, station2.lng);
  const result = {
    station1: {
      name: `station ${index1}`,
      population: population1,
      probability: station1.prob?.probability,
      lat: station1.lat,
      lng: station1.lng,
    },
    station2: {
      name: `station ${index2}`,
      population: population2,
      probability: station2.prob?.probability,
      lat: station2.lat,
      lng: station2.lng,
    },
    comparison: population1 > population2 ? 'Station 1 has a higher population' : population1 < population2 ? 'Station 2 has a higher population' : 'Both stations have the same population',
  };

  setComparisonResult(result);
};
const toggleAccordion1 = () => {
  setIsAccordionOpen1(!isAccordionOpen1);
};

const handleCompareSearchChange1 = (event) => {
  setCompareSearchText1(event.target.value);
};

const handleCompareSearchChange2 = (event) => {
  setCompareSearchText2(event.target.value);
};
const handleInputFocus1 = () => {
  setIsInputFocused1(true);
};

const handleInputBlur1 = () => {
  setIsInputFocused1(false);
};

const handleInputFocus2 = () => {
  setIsInputFocused2(true);
};
const handleInputBlur2 = () => {
  setIsInputFocused2(false);
};

const handleStationClick1 = (station) => {
  setCompareSearchText1(`station ${station.ind}`);
  setIsInputFocused1(false);
};

const handleStationClick2 = (station) => {
  setCompareSearchText2(`station ${station.ind}`);
  setIsInputFocused2(false);
};
const calculateResult = (lat, lng) => {
  const key = `${lat},${lng}`;
  const data = globalMap[key];
 console.log({key})
  if (!data) {
    console.log("No data found for the specified coordinates.");
    return null; // No data for the given lat/lng
  }

  const parkingValue = data['parking'] || 0; // Default to 0 if not found
  const parkValue = data['park'] || 0;       // Default to 0 if not found

  // Calculate the remaining sum, excluding population
  const remainingSum = Object.keys(data).reduce((sum, endpoint) => {
    if (endpoint !== 'population') {
      return sum + (data[endpoint] || 0); // Add values, default to 0 if not found
    }
    console.log({sum})
    return sum;
  }, 0);

  // Calculate the result
  const result = (parkingValue * parkValue) + remainingSum;

  return result;
};
useEffect(() => {
 console.log({selectedScopes})
}, [selectedScopes]);

  return (
    <div className="flex flex-col h-screen">
        <div className="absolute top-[75px] left-[580px]  transform -translate-x-1/2 m-0  p-0 rounded-md  z-50 w-[660px]">
        <input
          type="text"
          className="p-2 border rounded-md w-full"
          placeholder="Enter City Name"
          value={filterText}
          onChange={handleFilterChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      {isInputFocused && (
        <ul className="border rounded-md p-2 bg-white shadow-lg">
          {filteredCities.length > 0 ? (
            filteredCities.map((city, index) => (
              <li
                key={index}
                className="p-1 hover:bg-gray-200 cursor-pointer"
                onMouseDown={() => handleCityClick(city)}
              >
                {city}
              </li>
            ))
          ) : (
            <li className="p-1">No cities found</li>
          )}
        </ul>
      )}
        {/* <select
          className="p-2 border rounded-md"
          value={selectedCity}
          onChange={handleCityChange}
        >
          <option value="" disabled>Select a city</option>
          {filteredCities.map((city, index) => (
            <option key={index} value={city}>{city}</option>
          ))}
        </select> */}
      </div>
    <nav style={{ backgroundColor: '#191b61' }} className="text-white p-4">        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-bold">EV Station App</div>
          <div className="space-x-4">


            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </nav> 

      <div className="flex flex-1">

      <div style={{ backgroundColor: '#151640' }} className="text-white p-4 w-1/5">
          <h2 className="text-lg font-bold mb-4">Filters</h2>
          {/* <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Option 1
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Option 2
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Option 3
            </label>
            </div> */}
            <div className="mt-4">
    <label className="block mb-2">Map</label>
    <select className="w-full p-2 bg-blue-900 text-white rounded">
      <option value="map1">Map 1</option>
      <option value="map2">Map 2</option>
      <option value="map3">Map 3</option>
    </select>
  </div>
  <div className="mt-4">
  {scopeOptions.map((item,index) => (
        <div className="space-y-2">
          <label key={index} className="flex items-center space-x-10">
            <input type="checkbox" className="mr-2 custom-checkbox"   checked={selectedScopes.includes(item.label)}
              onChange={() => handleCheckboxChange(item.label)} />
            {item.label}
            <span className={`ml-2 inline-block w-3 h-3 ${item.color} rounded-full`}></span>
          </label>
      </div>
    ))}
</div>

  {/* <div className="mt-4">
    <label className="block mb-2">SCOPE</label>
    <div className="space-y-2">
      <label className="flex items-center space-x-10">
        <input type="checkbox" className="mr-2 custom-checkbox" />
        &gt; 80%
        <span className="ml-2 inline-block w-3 h-3 bg-green-500 rounded-full"></span>

      </label>
      <label className="flex items-center space-x-6">
        <input type="checkbox" className="mr-2" />
        60 - 80%
        <span className="ml-2 inline-block w-3 h-3 bg-yellow-400 rounded-full"></span>

      </label>
      <label className="flex items-center space-x-6">
        <input type="checkbox" className="mr-2" />
        40 - 60%
        <span className="ml-2 inline-block w-3 h-3 bg-yellow-600 rounded-full"></span>

      </label>
      <label className="flex items-center space-x-2.5">
        <input type="checkbox" className="mr-2" />
        Below 40%
        <span className="ml-2 inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
      </label>
    </div> */}
    {/* </div> */}
    <div className="mt-4 flex items-center space-x-2">
      <div className="relative group">
        <img src={QuestionIcon} alt="Info" className="info-icon cursor-pointer w-5 h-5" />
        <div className="absolute top-full mb-2 hidden w-48 p-2 text-sm text-white bg-gray-800 rounded-md shadow-md group-hover:block">
          How scope is calculated: [Your explanation here]
        </div>
      </div>
      <span className="text-sm">How scope is calculated</span>
    </div>
    <h3
                  className="text-md font-medium mt-2 cursor-pointer"
                  onClick={toggleAccordion}
                >
                  Pinned Items
                </h3>
                {isAccordionOpen && (
                  <ul>
                    { pinnedItems.map((item, index) => (
      <ListItem key={index} item={item} index={index} />
    ))}
                  </ul>
                )}
  </div>

        {/* Right Section: Maps */}
        {/* <div className="w-full flex flex-col h-full"> */}
          {/* <div className="flex flex-1 h-full"> */}
            {/* Map for EV Stations */}
            {/* <div className="w-1/2 h-full"> */}
              {/* <EvStation locations={locations} evStations={evStations} /> */}
            {/* </div> */}

            {/* Separator */}
            {/* <div className="w-0.5 bg-gray-300"></div> */}

            {/* Map for Heatmap */}
            {/* <div className="w-1/2 h-full">
              <HeatmapComponent />
            </div> */}
          {/* </div> */}
        {/* </div> */}
        
        <div className="w-full flex flex-col h-full">
          <div className="flex flex-1 h-full">
            {/* Map for EV Stations */}
            <div className="w-full h-full">
              {/* <HeatMapComponent population={population} /> */}
              {populationMap.size > 0 &&              <EvStation
              evStationPlacements={evStationPlacements}
              hoveredStation={hoveredStation}
              setHoveredStation={setHoveredStation}
              selectedScopes={selectedScopes}
              setCurrentDensity={setCurrentDensity}
              populationMap={populationMap}
              pinnedItems={pinnedItems}
              locations={locations}
              setPinnedItems={setPinnedItems}
              evStations={evStations}
              defaultCenter={cityData?.get(selectedCity)}
              setHoveredProbability={setHoveredProbability} // Pass setHoveredProbability to EvStation
            />}
            </div>
            {/* Separator */}
            <div className="w-0.5 bg-gray-300"></div>
            <div className="w-2/5 h-full bg-gray-100 p-2">
              <div className="p-2">
                <div className="bg-gray-200 p-2 rounded-md mb-2">
                  <h3 className="text-md font-medium">Locality Scope</h3>
                  <p className="text-4xl font-bold">{hoveredProbability !== null ? `${(hoveredProbability?.probability * 100).toFixed(2)}%` : 'N/A'}</p> {/* Display hovered probability */}
                  </div>
                <div className="bg-gray-200 p-2 rounded-md mb-2">
          <h3 className="text-md font-medium">Specifics</h3>
          <div className="mt-2 flex justify-between">
            <p className="text-sm font-medium">Population Density:</p>
            <p className="text-md font-bold">{currentDensity}</p>
          </div>
          {/* <div className="mt-2 flex justify-between">
            <p className="text-sm font-medium">Traffic:</p>
            <p className="text-lg font-bold">Moderate</p>
          </div> */}
          <div className="mt-2 flex justify-between">
            <p className="text-sm font-medium">Places of Interest:</p>
            <p className="text-lg font-bold">{calculateResult(hoveredStation?.lat, hoveredStation?.lng)}</p>
          </div>
          </div>

          <div className="bg-gray-200 p-2 rounded-md mb-2">
      <h3
        className="text-md font-medium cursor-pointer"
        onClick={toggleAccordion1}
      >
        Compare
      </h3>
      {isAccordionOpen1 && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div className="relative w-full">
              <input
              type="text"
              className="p-2 border rounded-md w-full"
              placeholder="Enter Station"
              value={compareSearchText1}
              onChange={handleCompareSearchChange1}
              onFocus={handleInputFocus1}
              onBlur={handleInputBlur1}
            />
           {isInputFocused1 && (
                <ul className="absolute z-10 border rounded-md p-2 bg-white shadow-lg w-full">
                  {evStationPlacements?.length > 0 ? (
                    evStationPlacements?.map((station, index) => (
                      <li
                        key={index}
                        className="p-1 hover:bg-gray-200 cursor-pointer"
                        onMouseDown={() => handleStationClick1(station)}
                      >
                        station {station.ind}
                      </li>
                    ))
                  ) : (
                    <li className="p-1">No stations found</li>
                  )}
                     </ul>
              )}
            </div>
            <span className="mx-2">vs</span>
            <div className="relative w-full">
              <input
                type="text"
                className="p-2 border rounded-md w-full"
                placeholder="Enter Station"
                value={compareSearchText2}
                onChange={handleCompareSearchChange2}
                onFocus={handleInputFocus2}
                onBlur={handleInputBlur2}
              />{isInputFocused2 && (
                <ul className="absolute z-10 border rounded-md p-2 bg-white shadow-lg w-full">
                  {evStationPlacements.length > 0 ? (
                    evStationPlacements.map((station, index) => (
                      <li
                        key={index}
                        className="p-1 hover:bg-gray-200 cursor-pointer"
                        onMouseDown={() => handleStationClick2(station)}
                      >
                        station {station.ind}
                      </li>
                    ))
                  ) : (
                    <li className="p-1">No stations found</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4" style={{width : "200px"}}>
            {/* Additional details go here */}

            {comparisonResult && (
                <div className="mt-2 p-2 bg-gray-200 rounded-md">
                  <h4 className="text-md font-medium">Comparison Result:</h4>
                  {typeof comparisonResult === 'string' ? (
                    <p>{comparisonResult}</p>
                  ) : (
                    <div className="overflow-x-auto">

<table className="min-w-full bg-white">
<thead>
                        <tr>
                          <th className="py-2">{comparisonResult.station1.name}</th>
                          <th className="py-2">{comparisonResult.station2.name}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                        <td className="border px-4 py-2">Population Density</td>
                          <td className="border px-4 py-2">{comparisonResult.station1.population}</td>
                          <td className="border px-4 py-2">{comparisonResult.station2.population}</td>
                        </tr>
                        <tr>
                          <td className="border px-4 py-2">Probability</td>
                          <td className="border px-4 py-2">{(comparisonResult.station1.probability * 100).toFixed(2)}%</td>
                          <td className="border px-4 py-2">{(comparisonResult.station2.probability * 100).toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
          {/* <div className="bg-gray-200 p-2 rounded-md mb-2">
            <h3 className="text-md font-medium">Compare</h3>
            <div className="mt-2 flex items-center justify-between">
              <select className="p-2 border rounded-md">
              {evStationPlacements.map((station, index) => (
                <option key={index} value={station.ind}>
                  station {station.ind}
                </option>
              ))} 
              </select>
              <span className="mx-2">vs</span>
              <select className="p-2 border rounded-md">
              {evStationPlacements.map((station, index) => (
                <option key={index} value={station.ind}>
                  station {station.ind}
                </option>
              ))}
              </select>
            </div>
          </div>
             */}
          <div className="bg-gray-200 p-2 rounded-md mb-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
            <h3 className="text-md font-medium">Stations</h3>
            <table className="w-full mt-2">
  <thead>
    <tr className="bg-gray-300">
      <th className="text-left text-sm font-medium p-2" style={{ borderTopLeftRadius: '10px' }}>Name</th>
      <th className="text-left text-sm font-medium p-2">Scope</th>
      <th className="text-left text-sm font-medium p-2" style={{ borderTopRightRadius: '10px' }}>Color</th>
    </tr>
  </thead>
  <tbody>
    {evStationPlacements?.map((station, index) => (
      <tr key={index}>
        <td className="text-sm">{`station ${station.ind}`}</td>
        <td className="text-sm">
          {Math.floor(station.prob?.probability * 100)}%
        </td>
        <td className="text-sm">
          <span
            className="inline-block w-4 h-4 rounded-full"
            style={{ backgroundColor: getScopeColor(Math.floor(station.prob?.probability * 100)) }}
          ></span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
            </div>
              </div>
            </div>
            </div>
        </div>


      </div>
    </div>
  );
};

export default App;
