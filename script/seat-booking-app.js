'use strict';

class SeatBookingApp {
    constructor(name) {
        this._name = name;
        this._sectors = [];
        this._priceMultipliers = [];
        this._services = [];
        this._currentServiceId = '';
    }
    getName() {
        return this._name;
    }
    addSector(sector) {
        this._sectors.push(sector);
    }
    getSectorsArray() {
        return this._sectors;
    }
    setPriceMultipliersArray() {
        // get sectors array
        const sectors = this.getSectorsArray();
        sectors.forEach((sector) => {
            const sectorId = sector.getId();
            const sectorPrice = sector.getPriceMultiplier();
            this._priceMultipliers.push(
                {
                    sector: sectorId,
                    priceMultiplier: sectorPrice
                }
            );
        });
    }
    getPriceMultipliersArray() {
        return this._priceMultipliers;
    }
    renderSectorsList() {
    const sectors = this.getPriceMultipliersArray()
    const container = document.querySelector(`#sectors-list`);
    container.innerHTML = "";
    sectors.forEach((sector) => {
        const listElement = document.createElement('li');
        const sectorName = sector.sector;
        const inputId = `price-${sectorName}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sectorName;
        
        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.textContent = ` multiplier: `;
        
        const priceInput = document.createElement('input');
        priceInput.setAttribute('id', inputId);
        priceInput.value = sector.priceMultiplier;
        
        listElement.appendChild(nameSpan);
        listElement.appendChild(label);
        listElement.appendChild(priceInput);
        container.appendChild(listElement);
    })
}
    addService(service) {
        this._services.push(service);
    }
    getServicesArray() {
        return this._services;
    }
    renderServicesList() {
        // get services array
        const services = this.getServicesArray();
        // get container (dropdown element from Document)
        const dropdownElement = document.querySelector(`#services-list`);
        // clear container
        dropdownElement.innerHTML = "";
        // populate container with existing services
        if (services.length === 0) {
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Create a service with Add new first';
            placeholder.disabled = true;
            dropdownElement.appendChild(placeholder);
            this.setCurrentServiceId('');
        } else {
            services.forEach((service) => {
                const optionElement = document.createElement('option');
                optionElement.setAttribute('value', service.getId());
                optionElement.textContent = service.getName();
                dropdownElement.appendChild(optionElement);
            });
            this.setCurrentServiceId(dropdownElement.value);
        }
    }
    getCurrentServiceId() {
        return this._currentServiceId;
    }
    getCurrentService() {
        // this.renderServicesList();
        // get services array
        const services = this.getServicesArray();
        return services.find((service) => {
            return service.getId() === this.getCurrentServiceId()
        })
    }
    setCurrentServiceId(serviceId) {
        this._currentServiceId = serviceId;
        // console.log(this.getCurrentService());
    }
    renderCurrentServiceData() {
        // get current service
        const currentService = this.getCurrentService();

        if(currentService) {
            // get input elements
            const inputServiceName = document.querySelector(`#service-name`);
            const inputServicePrice = document.querySelector(`#service-price`);
            // set current service data as input values
            inputServiceName.value = currentService.getName();
            inputServicePrice.value = currentService.getPrice();
        }
    }
    cacheServices() {
        // check if localStorage is available
        if(typeof(Storage) !== "undefined") {
            // localStorage is available
            localStorage.setItem(`sba-services-${this.getName()}`, JSON.stringify(this.getServicesArray()));
        } else {
            // localStorage is not available
            window.alert(`Access to localStorage in this browser is not available. Data cannot be saved.`);
            throw Error(`Access to localStorage in this browser is not available. Data cannot be saved.`);
        }
    }
    fetchServices() {
        const raw = localStorage.getItem(`sba-services-${this.getName()}`);
        if (!raw) {
            console.log(`Let's add some services. Use the form on the left.`);
            this._currentServiceId = '';
            return;
        }
        let servicesJSON;
        try {
            servicesJSON = JSON.parse(raw);
        } catch (e) {
            console.warn('Invalid cached services JSON; starting empty.');
            this._currentServiceId = '';
            return;
        }
        if (!servicesJSON || !Array.isArray(servicesJSON)) {
            this._currentServiceId = '';
            return;
        }
        servicesJSON.forEach((service) => {
            const serviceInstance = new Service(service._name, service._price);
            serviceInstance.setBookedSeatsArray(service._seatsBooked);
            this.addService(serviceInstance);
        });
    }
updateOrderDetails() {
    const currentService = this.getCurrentService();
    if (!currentService) return;
    const servicePrice = currentService.getPrice();
    const priceMultipliers = this.getPriceMultipliersArray();
    // now reservedSeats contains ID strings instead of DOM elements
    const reservedSeatIds = currentService.getReservedSeats();
    const container = document.querySelector(`#order-details`);
    container.innerHTML = '';
    const totalPriceContainer = document.querySelector(`#order-total-price`);
    totalPriceContainer.innerHTML = '';
    let totalPrice = 0;
    reservedSeatIds.forEach((seatId) => {
        // look up DOM element by ID
        const seatElement = document.getElementById(seatId);
        if (!seatElement) return;
        const currentSectorId = seatElement.parentElement.parentElement.id;
        const sectorPrice = priceMultipliers.find((element) => {
            return element.sector === currentSectorId;
        }).priceMultiplier
        const seatPrice = parseFloat((servicePrice * sectorPrice).toFixed(2))
        totalPrice += seatPrice;
        const listItem = document.createElement(`li`)
        const listItemId = document.createElement(`span`)
        listItemId.textContent = seatId
        const listItemPrice = document.createElement(`span`)
        listItemPrice.textContent = `$${seatPrice}`
        container.appendChild(listItem)
        listItem.appendChild(listItemId)
        listItem.appendChild(listItemPrice)
        const totalPriceElement = document.createElement(`span`)
        totalPriceElement.textContent = `Total price: $${parseFloat(totalPrice.toFixed(2))}`
        totalPriceContainer.innerHTML = '';
        totalPriceContainer.appendChild(totalPriceElement)
    })
    }
    /* disabled until there is a way of creating sectors by user
    cacheSectors() {
        // check if localStorage is available
        if(typeof(Storage) !== "undefined") {
            // localStorage is available
            localStorage.setItem(`sba-sectors-${this.getName()}`, JSON.stringify(this.getSectorsArray()));
        } else {
            // localStorage is not available
            window.alert(`Access to localStorage in this browser is not available. Data cannot be saved.`);
            throw Error(`Access to localStorage in this browser is not available. Data cannot be saved.`);
        }
    }
    fetchSectors() {
        // fetch data from localStorage
        const sectorsJSON = JSON.parse(localStorage.getItem(`sba-sectors-${this.getName()}`));

        if(!sectorsJSON) {
            // if there's no data, notify user
            console.log(`There are no sectors in localStorage`)
        } else {
            sectorsJSON.forEach((sector) => {
                // create Service instances and add to app's array
                const sectorInstance = (new Sector(sector._id, sector._priceMultiplier))
                // serviceInstance.setBookedSeatsArray(sector._seatsBooked);
                this.addSector(sectorInstance)
            })
        }
    }
    */
};

class Service {
    constructor(name, price) {
        this._id = crypto.randomUUID();
        this._name = name;
        this._price = price;
        this._seatsReserved = []; // contains seats' IDs
        this._seatsBooked = []; // contains seats' IDs
    }
    getId() {
        return this._id;
    }
    getName() {
        return this._name;
    }
    getPrice() {
        return this._price;
    }
    setName(name) {
        this._name = name;
    }
    setPrice(price) {
        this._price = price;
    }
    getBookedSeats() {
        return this._seatsBooked;
    }
    bookSeats() {
    // get reserved seats (now contains ID strings)
    const reservedSeats = this.getReservedSeats();
    // transfer IDs to booked seats array
    reservedSeats.forEach((seatId) => {
        this._seatsBooked.push(seatId)
    })
    // clear `reserved seats` array
    this.clearReservedSeats();
    // update corresponding `seat` elements on the page
    this.markBookedSeats();
}
    getReservedSeats() {
        return this._seatsReserved;
    }
    addReservedSeat(seat) {
        this._seatsReserved.push(seat)
    }
    removeReservedSeat(seatId) {
    const index = this._seatsReserved.findIndex((id) => {
        return id === seatId
    });
    if (index !== -1) {
        this._seatsReserved.splice(index, 1);
    }
}
    clearReservedSeats() {
        this._seatsReserved = [];
    }
    setBookedSeatsArray(array) {
        this._seatsBooked = array;
    }
    markBookedSeats() {
        // get all rendered seat elements
        const seatElements = document.querySelectorAll('.seat');
        // refresh seats' classes
        seatElements.forEach((seat) => {
            if(this._seatsBooked.includes(seat.id)) {
            seat.classList.remove('seat--reserved');
            seat.classList.add('seat--booked');  
            }
        })
    }
};

class Sector {
    constructor(id, priceMultiplier = 1, ...seatsInRow) {
        this._id = `s-${String(id)}`;
        this._priceMultiplier = priceMultiplier;
        this._rows = seatsInRow.length;
        this._seats = [...seatsInRow];
        
        // create array of rows and seats
        // rows
        for(let i = 1; i <= seatsInRow.length; i++) {
            const rowId = `${this._id}-${i}`;
            
            // seats
            for(let j = 1; j <= seatsInRow[i-1]; j++) {
                const seatId = `${rowId}-${j}`;
                // create new seat object and push it into array
                this._seats.push({
                    sector: this._id,
                    row: rowId,
                    seat: seatId
                });
            }
        }
    }
    getId() {
        return this._id;
    }
    getPriceMultiplier() {
        return this._priceMultiplier;
    }
    setPriceMultiplier(priceMultiplier) {
        this._priceMultiplier = priceMultiplier;
    }
    renderSector() {
        // get main app container
        const appContainer = document.querySelector(`#seat-booking-app`);
        // if there is no container, throw error
        if(!appContainer) throw Error(`App container not found`);
        
        // get seats container
        const seatsContainer = document.querySelector(`#seats`);
        // if there is no container, throw error
        if(!seatsContainer) throw Error(`Seats container not found`);
        // get sector's id
        const sectorId = this._id;
        // get sector's name (without the `s-` prefix)
        const sectorName = sectorId.slice(2);
        // get `seats` array
        const seats = this._seats;

        // create sector container
        const sectorElement = document.createElement('div');
        sectorElement.classList.add(`sector`);
        sectorElement.setAttribute(`id`, sectorId);
        sectorElement.style.gridArea = sectorName;
        // append sector to the seats container
        seatsContainer.appendChild(sectorElement);

        for(let i = 0; i < this._rows; i++) {
            // create row container
            const rowElement = document.createElement('div');
            rowElement.classList.add(`row`);
            rowElement.setAttribute(`id`, `${sectorId}-${i + 1}`);
            // append row to sector container
            sectorElement.appendChild(rowElement);

            for(let j = 0; j < seats.length; j++) {
                // check if seat belongs to current row
                if (seats[j].row === `${sectorId}-${i + 1}`) {
                    // create seat element
                    const seatElement = document.createElement('div');
                    seatElement.classList.add(`seat`);
                    seatElement.setAttribute(`id`, seats[j].seat);
                    // append seat to current row container
                    rowElement.appendChild(seatElement);
                };
            };
        };

        //create sector label
        const sectorLabel = document.createElement('span');
        sectorLabel.textContent = sectorId;
        sectorLabel.classList.add('sector__label');
        sectorElement.appendChild(sectorLabel);
    };
};

// CREATE SECTORS (name, priceMultiplier, ...seatsInRow) ----------------------
const sectorA1 = new Sector(`A1`, 1.0, 20, 20);
sectorA1.renderSector();

const sectorA2 = new Sector(`A2`, 1.2, 20, 20, 20);
sectorA2.renderSector();

const sectorB1 = new Sector(`B1`, 1.2, 20, 20, 20, 20);
sectorB1.renderSector();

const sectorB1L = new Sector(`B1L`, 1.4, 1, 1, 1, 1, 1, 1);
sectorB1L.renderSector();

const sectorB2L = new Sector(`B2L`, 1.4, 1, 1, 1, 1, 1, 1);
sectorB2L.renderSector();

const sectorC1L = new Sector(`C1L`, 1.5, 12);
sectorC1L.renderSector();

// UTILITY FUNCTIONS ----------------------------------------------------------
const localStorageSpace = function(){
    let data = '';

    console.log('Current local storage: ');
    for(let key in window.localStorage){
        if(window.localStorage.hasOwnProperty(key)){
            data += window.localStorage[key];
            console.log( key + " = " + ((window.localStorage[key].length * 16)/(8 * 1024)).toFixed(2) + ' KB' );
        }
    }

    console.log(data ? '\n' + 'Total space used: ' + ((data.length * 16)/(8 * 1024)).toFixed(2) + ' KB' : 'Empty (0 KB)');
    console.log(data ? 'Approx. space remaining: ' + (5120 - ((data.length * 16)/(8 * 1024)).toFixed(2)) + ' KB' : '5 MB');
};

// APP FUNCTIONS --------------------------------------------------------------
function initializeApp(instanceName) {
    console.log(`Seat-Booking App instance "${instanceName}" has been successfully created!`);
    return new SeatBookingApp(instanceName);
};

function renderBookedSeats() {
    if(showingRoom1.getCurrentService()) {
        // get current Service's booked seats array
        const bookedSeats = showingRoom1.getCurrentService().getBookedSeats();
        // get all rendered seat elements
        const seatElements = document.querySelectorAll('.seat');
        seatElements.forEach((seat) => {
            if(bookedSeats.includes(seat.id)) {
                seat.classList.add(`seat--booked`)
            } else {
                seat.classList.remove(`seat--booked`)
            }
        });
    }
};

// INITIALIZE APP -------------------------------------------------------------
const showingRoom1 = initializeApp(`showingRoom1`);
// add sectors
showingRoom1.addSector(sectorA1)
showingRoom1.addSector(sectorA2)
showingRoom1.addSector(sectorB1)
showingRoom1.addSector(sectorB1L)
showingRoom1.addSector(sectorB2L)
showingRoom1.addSector(sectorC1L)
// create initial price multipliers array
showingRoom1.setPriceMultipliersArray()
// fetch Services from localStorage
showingRoom1.fetchServices();
// render user interface
showingRoom1.renderSectorsList();
showingRoom1.renderServicesList();
showingRoom1.renderCurrentServiceData();
renderBookedSeats();

function updateBlockedState() {
    const noServices = showingRoom1.getServicesArray().length === 0;
    const current = showingRoom1.getCurrentService();
    const hasReserved =
        current &&
        Array.isArray(current.getReservedSeats()) &&
        current.getReservedSeats().length > 0;

    const screeningRoom = document.querySelector('#screening-room-1');
    const serviceList = document.querySelector('#services-list');
    const updateBtn = document.querySelector('#service-update-btn');
    const deleteBtn = document.querySelector('#service-delete-btn');
    const bookBtn = document.querySelector('#book-seats-btn');
    const sectorsSave = document.querySelector('#sectors-save-btn');
    const sectorsPriceBtn = document.querySelector('#sectors-price-btn');

    if (serviceList) {
        serviceList.disabled = noServices;
    }
    if (updateBtn) {
        updateBtn.disabled = noServices;
    }
    if (deleteBtn) {
        deleteBtn.disabled = noServices;
    }
    if (bookBtn) {
        bookBtn.disabled = noServices || !hasReserved;
    }
    if (sectorsSave) {
        sectorsSave.disabled = noServices;
    }
    if (sectorsPriceBtn) {
        sectorsPriceBtn.disabled = noServices;
    }

    document.querySelectorAll('#sectors-list input').forEach((input) => {
        input.disabled = noServices;
    });

    if (screeningRoom) {
        if (noServices) {
            screeningRoom.setAttribute('inert', '');
        } else {
            screeningRoom.removeAttribute('inert');
        }
    }
}

updateBlockedState();

// GET ELEMENTS FROM DOM ------------------------------------------------------
// get all rendered seat elements
const seatElements = document.querySelectorAll('.seat');
seatElements.forEach((seat) => {
    // show seat label on mouseover
    seat.addEventListener('mouseover', (e) => {
        const seatInfo = document.createElement('div');
        seatInfo.classList.add(`seat__info`);
        seatInfo.textContent = e.target.id;
        e.target.parentElement.appendChild(seatInfo);
    })
    // hide seat label on mouseleave
    seat.addEventListener('mouseleave', () => {
        document.querySelector(`.seat__info`).remove();
    })
    // toggle seat as reserved on click
    seat.addEventListener('click', (e) => {
        // if no service exists, don't do anything
        if (!showingRoom1.getCurrentService()) return;
        // if this seat is taken, don't do anything
        if (!seat.classList.contains(`seat--booked`)) {
            e.target.classList.toggle('seat--reserved');
            // get current service
            const currentService = showingRoom1.getCurrentService();
            if (seat.classList.contains(`seat--reserved`)) {
                // save seat ID (string) in array
                currentService.addReservedSeat(e.target.id);
                showingRoom1.updateOrderDetails();
            } else {
                // remove seat ID from array
                currentService.removeReservedSeat(e.target.id);
                showingRoom1.updateOrderDetails();
            }
            updateBlockedState();
        };
    });
});

// get `current service` dropdown element
// UTILITY: clear all visually reserved seats
function clearAllReservedVisuals() {
    document.querySelectorAll('.seat--reserved').forEach(el => {
        el.classList.remove('seat--reserved');
    });
    document.querySelector(`#order-details`).innerHTML = '';
    document.querySelector(`#order-total-price`).innerHTML = '';
}

const dropdownElement = document.querySelector(`#services-list`);
dropdownElement.addEventListener('change', (e) => {
    // clear reserved seats of previous service (visual + data)
    const prevService = showingRoom1.getCurrentService();
    if (prevService) {
        prevService.getReservedSeats().forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('seat--reserved');
        });
        prevService.clearReservedSeats();
    }
    // clear order details
    document.querySelector(`#order-details`).innerHTML = '';
    document.querySelector(`#order-total-price`).innerHTML = '';

    // update current service ID
    showingRoom1.setCurrentServiceId(e.target.value);
    renderBookedSeats();
    showingRoom1.renderCurrentServiceData();
    updateBlockedState();
});

// get `add new Service` button element
const serviceAddBtn = document.querySelector(`#service-add-btn`);
serviceAddBtn.addEventListener('click', (e) => {
    // get input elements
    const inputServiceName = document.querySelector(`#service-name`).value;
    const inputServicePrice = document.querySelector(`#service-price`).value;
    // create new Service instance
    const newService = new Service(inputServiceName, inputServicePrice)

    clearAllReservedVisuals();
    showingRoom1.addService(newService);
    showingRoom1.cacheServices();
    showingRoom1.renderServicesList();
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully added`);
    localStorageSpace();
    updateBlockedState();
});

// get `update Service` button element
const serviceUpdateBtn = document.querySelector(`#service-update-btn`);
serviceUpdateBtn.addEventListener('click', () => {
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) {
        return;
    }
    // get input elements
    const inputServiceName = document.querySelector(`#service-name`).value;
    const inputServicePrice = document.querySelector(`#service-price`).value;
    clearAllReservedVisuals();
    currentService.clearReservedSeats();
    currentService.setName(inputServiceName);
    currentService.setPrice(inputServicePrice);

    showingRoom1.cacheServices();
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully updated`);
    localStorageSpace();
    updateBlockedState();
});

// get `delete Service` button element
const serviceDeleteBtn = document.querySelector(`#service-delete-btn`);
serviceDeleteBtn.addEventListener('click', () => {
    const currentSvc = showingRoom1.getCurrentService();
    if (!currentSvc) {
        return;
    }

    // get current service name
    const inputServiceName = document.querySelector(`#service-name`).value;
    // get current service ID
    const currentServiceId = showingRoom1.getCurrentServiceId();
    // get all services array
    const servicesArray = showingRoom1.getServicesArray();
    const indexToDelete = servicesArray.findIndex((service) => {
        return service.getId() === currentServiceId;
    });
    // remove current service from array
    clearAllReservedVisuals();
    currentSvc.clearReservedSeats();
    servicesArray.splice(indexToDelete, 1)

    showingRoom1.cacheServices();
    showingRoom1.renderServicesList()
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully removed`);
    localStorageSpace();
    updateBlockedState();
});

// get `book seats` button element
const bookSeatsBtn = document.querySelector(`#book-seats-btn`)
bookSeatsBtn.addEventListener('click', () => {
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) {
        return;
    }

    currentService.bookSeats();
    showingRoom1.cacheServices();
    updateBlockedState();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SeatBookingApp,
        Service,
        Sector,
        showingRoom1,
        renderBookedSeats,
        localStorageSpace,
        initializeApp
    };
}