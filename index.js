// GLobal variables
let maxMass = 0;
let minMass = 100;

// Construct Map
const map = L.map('map-container').setView([0, 0], 1);

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const tileURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const tiles = L.tileLayer(tileURL, {attribution})
tiles.addTo(map)

map.setMaxBounds(map.getBounds());
map.touchZoom.disable();

// Add Key
//lookup key, add HTML
L.control.scale().addTo(map)


// REquest API meteorite data
// https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json
function onResponse(resp) {
    if (resp.status !== 200) {
        console.log(`Looks like there was a problem. Status Code: ${resp.status}`);
        return;
    }
    // Examine the text in the response
    resp.json().then(addMeteoriteCircles)
}


function onError(err) {
console.log('Fetch Error :-S', err)
}

fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json')
.then(onResponse)
.catch(onError);
  

// On API response:

function processMeteorite(info) {
    console.log(info)
    if(info.mass < minMass) {
        minMass = info.mass
    } else if(info.mass > maxMass) {
        maxMass = info.mass
    }
    // Add Meatorite circle to map
    const marker = L.circle([info.lat, info.long], {radius: info.mass/2}).addTo(map);

    //Attempt to arrange layer level of meteorite circles vaguely according to size. 
    //This prevents the situation where larger circles obscure smaller ones and make them unclickable. It is acknowledged that this is an imperfect solution.
    if(info.mass > (maxMass - minMass)/2) {
        marker.bringToBack()
    } else {
        marker.bringToFront()
    }

    // Add hover to circle
    marker.bindPopup(`
    <div>name: ${info.name},</div>
    <div>mass: ${info.mass/1000}kg,</div>
    <div>year of impact: ${info.date}</div>`, {className: 'my-popup'});
    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });

    // Populate article snapshot (needs to happen in response to previous API request for each meteorite)
    // - search wiki for article based on 'name + "meteorite"
    // - splice paragraph and add to pop up info
    // add link to pop up info
    const fetchData = async () => {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=20&srsearch=${info.name + " (meteorite)"}`)
        const json = await res.json();
        console.log(info.name)
        console.log(json.query.search[0] ? json.query.search[0].snippet: "null search")
        info.snippet = json.query.search[0] ? json.query.search[0].snippet: "null search"

        //Update Popup info
        marker.bindPopup(`
        <div>name: ${info.name},</div>
        <div>mass: ${info.mass/1000}kg,</div>
        <div>year of impact: ${info.date},</div>
        <div>snippet: ${info.snippet}..</div>`);
        marker.on('mouseover', function (e) {
            this.openPopup();
        });
        marker.on('mouseout', function (e) {
            this.closePopup();
        });
    }

    fetchData()
}
function addMeteoriteCircles(data) {
    console.log(data)
    data.features.forEach(item => {
        let meteoriteInfo = {
            name: item.properties.name,
            mass: item.properties.mass,
            date: item.properties.year,
            lat: item.geometry ? item.geometry.coordinates[1]: "geometry undefined",
            long: item.geometry ?item.geometry.coordinates[0]: "geometry undefined",
        }
        item.geometry ? processMeteorite(meteoriteInfo)
        :
        console.log(`undefined location for ${item}`)
    })


}




