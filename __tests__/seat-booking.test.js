const {
  SeatBookingApp,
  Service,
  Sector,
  localStorageSpace,
  showingRoom1,
  renderBookedSeats,
} = require('../script/seat-booking-app');

const ServiceModule = require('../script/Service');

let app;

beforeEach(() => {
  document.body.innerHTML = `
    <button id="lang-toggle">中文</button>
    <main id="seat-booking-app">
      <select id="services-list"></select>
      <input id="service-name" />
      <input id="service-price" />
      <ul id="sectors-list"></ul>
      <ul id="order-details"></ul>
      <span id="order-total-price"></span>
      <button id="book-seats-btn">Buy</button>
      <div id="seats"></div>
    </main>
  `;
  app = new SeatBookingApp('testRoom');
});

// --------------------------------------------------
// SeatBookingApp tests
// --------------------------------------------------
test('getName() should return the name passed to the constructor', () => {
  expect(app.getName()).toBe('testRoom');
});

test('addSector and getSectorsArray should correctly add and retrieve sectors', () => {
  const sector = new Sector('A1', 1.0, 10);
  app.addSector(sector);
  expect(app.getSectorsArray()).toHaveLength(1);
  expect(app.getSectorsArray()[0].getId()).toBe('s-A1');
});

test('setPriceMultipliersArray should build an array of sector-price objects', () => {
  const sector = new Sector('A1', 2.5, 5);
  app.addSector(sector);
  app.setPriceMultipliersArray();
  const multipliers = app.getPriceMultipliersArray();
  expect(multipliers).toEqual([{ sector: 's-A1', priceMultiplier: 2.5 }]);
});

test('renderSectorsList should populate #sectors-list with <li> elements', () => {
  const sector = new Sector('VIP', 3.0, 4);
  app.addSector(sector);
  app.setPriceMultipliersArray();
  app.renderSectorsList();
  const listItems = document.querySelectorAll('#sectors-list li');
  expect(listItems.length).toBe(1);
  expect(listItems[0].querySelector('span').textContent).toBe('s-VIP');
});

test('addService and getServicesArray should add and retrieve services', () => {
  const service = new Service('Movie A', 15);
  app.addService(service);
  expect(app.getServicesArray()).toHaveLength(1);
  expect(app.getServicesArray()[0].getName()).toBe('Movie A');
});

test('renderServicesList should populate the <select> dropdown and set the current service', () => {
  const s1 = new Service('Show 1', 20);
  const s2 = new Service('Show 2', 25);
  app.addService(s1);
  app.addService(s2);
  app.renderServicesList();
  const dropdown = document.getElementById('services-list');
  expect(dropdown.options.length).toBe(2);
  expect(dropdown.options[0].text).toBe('Show 1');
  expect(app.getCurrentServiceId()).toBe(s1.getId());
});

test('getCurrentService should return the correct service instance', () => {
  const s1 = new Service('S1', 10);
  app.addService(s1);
  app.renderServicesList();
  const current = app.getCurrentService();
  expect(current).toBeDefined();
  expect(current.getName()).toBe('S1');
});

test('cacheServices should store the services array in localStorage', () => {
  const s1 = new Service('Storage', 5);
  app.addService(s1);
  app.cacheServices();
  const stored = JSON.parse(localStorage.getItem('sba-services-testRoom'));
  expect(stored).toHaveLength(1);
  expect(stored[0]._name).toBe('Storage');
});

test('fetchServices should restore services from localStorage', () => {
  const mockService = { _name: 'Cached', _price: 12, _seatsBooked: [] };
  localStorage.setItem('sba-services-testRoom', JSON.stringify([mockService]));
  app.fetchServices();
  expect(app.getServicesArray()).toHaveLength(1);
  expect(app.getServicesArray()[0].getName()).toBe('Cached');
});

test('updateOrderDetails should calculate the correct total price based on reserved seats', () => {
  const service = new Service('Film', 20);
  app.addService(service);
  app.renderServicesList();
  const sector = new Sector('A1', 1.5, 1);
  app.addSector(sector);
  app.setPriceMultipliersArray();
  const sectorDiv = document.createElement('div');
  sectorDiv.id = 's-A1';
  const row = document.createElement('div');
  row.id = 's-A1-1';
  const seat = document.createElement('div');
  seat.className = 'seat';
  seat.id = 's-A1-1-1';
  row.appendChild(seat);
  sectorDiv.appendChild(row);
  document.getElementById('seats').appendChild(sectorDiv);
  service._seatsReserved = ['s-A1-1-1'];
  app.updateOrderDetails();
  const orderDetails = document.getElementById('order-details');
  expect(orderDetails.children.length).toBe(1);
  const totalSpan = document.getElementById('order-total-price');
  expect(totalSpan.textContent).toContain('30');
});

test('fetchServices should restore multiple services and set booked seats', () => {
  const mockServices = [
    { _name: 'S1', _price: 10, _seatsBooked: ['seat-1'] },
    { _name: 'S2', _price: 20, _seatsBooked: [] }
  ];
  localStorage.setItem('sba-services-testRoom', JSON.stringify(mockServices));
  app.fetchServices();
  const services = app.getServicesArray();
  expect(services).toHaveLength(2);
  expect(services[0].getBookedSeats()).toEqual(['seat-1']);
  expect(services[1].getBookedSeats()).toEqual([]);
});

test('setPriceMultipliersArray when no sectors should produce empty array', () => {
  app.setPriceMultipliersArray();
  expect(app.getPriceMultipliersArray()).toEqual([]);
});

test('updateOrderDetails when no reserved seats should not crash', () => {
  const service = new Service('Film', 20);
  app.addService(service);
  app.renderServicesList();
  expect(() => app.updateOrderDetails()).not.toThrow();
  expect(document.getElementById('order-total-price').textContent).toBe('');
});

test('updateOrderDetails should handle multiple reserved seats across sectors', () => {
  const service = new Service('Multi', 10);
  app.addService(service);
  app.renderServicesList();
  const sectorA1 = new Sector('A1', 2.0, 1);
  const sectorB1 = new Sector('B1', 3.0, 1);
  app.addSector(sectorA1);
  app.addSector(sectorB1);
  app.setPriceMultipliersArray();
  const buildSeat = (sectorId, rowId, seatId) => {
    const sectorDiv = document.createElement('div');
    sectorDiv.id = sectorId;
    const row = document.createElement('div');
    row.id = rowId;
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.id = seatId;
    row.appendChild(seat);
    sectorDiv.appendChild(row);
    document.getElementById('seats').appendChild(sectorDiv);
    return seat;
  };
  buildSeat('s-A1', 's-A1-1', 's-A1-1-1');
  buildSeat('s-B1', 's-B1-1', 's-B1-1-1');
  service._seatsReserved = ['s-A1-1-1', 's-B1-1-1'];
  app.updateOrderDetails();
  const orderItems = document.querySelectorAll('#order-details li');
  expect(orderItems.length).toBe(2);
  const totalSpan = document.getElementById('order-total-price');
  expect(totalSpan.textContent).toContain('50');
});

test('renderServicesList should add placeholder when no services exist', () => {
  app.renderServicesList();
  const dropdown = document.getElementById('services-list');
  expect(dropdown.options.length).toBe(1);
  expect(dropdown.options[0].disabled).toBe(true);
});

test('getCurrentService should return undefined when no service is set', () => {
  const result = app.getCurrentService();
  expect(result).toBeUndefined();
});

test('updateOrderDetails should skip seat if element not found', () => {
  const service = new Service('Film', 20);
  app.addService(service);
  app.renderServicesList();
  const sector = new Sector('A1', 1.0, 1);
  app.addSector(sector);
  app.setPriceMultipliersArray();
  service._seatsReserved = ['non-existent'];
  expect(() => app.updateOrderDetails()).not.toThrow();
  expect(document.getElementById('order-details').children.length).toBe(0);
});

test('updateOrderDetails should return early if no current service', () => {
  app.setCurrentServiceId('');
  expect(() => app.updateOrderDetails()).not.toThrow();
});

test('setPriceMultipliersArray should handle multiple sectors', () => {
  const s1 = new Sector('A1', 1.5, 10);
  const s2 = new Sector('B1', 2.0, 5);
  app.addSector(s1);
  app.addSector(s2);
  app.setPriceMultipliersArray();
  expect(app.getPriceMultipliersArray()).toHaveLength(2);
});

test('removeReservedSeat should not modify array when ID not found', () => {
  const service = new Service('Test', 10);
  service.addReservedSeat('seat-1');
  service.removeReservedSeat('non-existent');
  expect(service.getReservedSeats()).toEqual(['seat-1']);
});

// --------------------------------------------------
// Service tests (bundled)
// --------------------------------------------------
describe('Service class (bundled)', () => {
  let service;
  beforeEach(() => {
    service = new Service('Test', 15);
  });

  test('should generate a unique id', () => {
    expect(service.getId()).toBeDefined();
    expect(service.getId()).toMatch(/^[0-9a-f-]+$/);
  });

  test('should add and remove reserved seats by string ID', () => {
    service.addReservedSeat('s-1-1');
    expect(service.getReservedSeats()).toHaveLength(1);
    service.removeReservedSeat('s-1-1');
    expect(service.getReservedSeats()).toHaveLength(0);
  });

  test('bookSeats should move string IDs to booked seats', () => {
    service.addReservedSeat('seat-1');
    service.bookSeats();
    expect(service.getBookedSeats()).toContain('seat-1');
  });

  test('setBookedSeatsArray should directly set the booked seats array', () => {
    service.setBookedSeatsArray(['s-A1-1-1', 's-A2-2-3']);
    expect(service.getBookedSeats()).toEqual(['s-A1-1-1', 's-A2-2-3']);
  });
});

// --------------------------------------------------
// Service tests (independent Service.js module)
// --------------------------------------------------
describe('Service class (independent module)', () => {
  test('should create a service instance with correct name and price', () => {
    const svc = new ServiceModule('Indie', 42);
    expect(svc.getName()).toBe('Indie');
    expect(svc.getPrice()).toBe(42);
  });

  test('should add and remove reserved seats using string IDs', () => {
    const svc = new ServiceModule('Test', 10);
    svc.addReservedSeat('seat-x');
    expect(svc.getReservedSeats()).toContain('seat-x');
    svc.removeReservedSeat('seat-x');
    expect(svc.getReservedSeats()).toHaveLength(0);
  });

  test('bookSeats should move reserved IDs to booked', () => {
    const svc = new ServiceModule('Test', 10);
    svc.addReservedSeat('seat-y');
    svc.bookSeats();
    expect(svc.getBookedSeats()).toContain('seat-y');
    expect(svc.getReservedSeats()).toHaveLength(0);
  });

  test('removeReservedSeat should not fail when ID not found', () => {
    const svc = new ServiceModule('Test', 10);
    svc.addReservedSeat('seat-a');
    svc.removeReservedSeat('non-existent');
    expect(svc.getReservedSeats()).toEqual(['seat-a']);
  });

  test('bookSeats with no reserved seats should result in empty booked', () => {
    const svc = new ServiceModule('Test', 10);
    svc.bookSeats();
    expect(svc.getBookedSeats()).toEqual([]);
  });

  test('setBookedSeatsArray should set and getBookedSeats work', () => {
    const svc = new ServiceModule('Test', 10);
    svc.setBookedSeatsArray(['a', 'b']);
    expect(svc.getBookedSeats()).toEqual(['a', 'b']);
  });

  test('setName and setPrice should update values correctly', () => {
    const svc = new ServiceModule('Old', 10);
    svc.setName('New');
    svc.setPrice(20);
    expect(svc.getName()).toBe('New');
    expect(svc.getPrice()).toBe(20);
  });

  test('clearReservedSeats should empty the reserved array', () => {
    const svc = new ServiceModule('Test', 10);
    svc.addReservedSeat('seat1');
    svc.clearReservedSeats();
    expect(svc.getReservedSeats()).toEqual([]);
  });
});

// --------------------------------------------------
// Sector tests
// --------------------------------------------------
describe('Sector class', () => {
  test('constructor should create seat objects based on rows argument', () => {
    const sector = new Sector('B1', 1.2, 2, 3);
    expect(sector.getId()).toBe('s-B1');
    expect(sector.getPriceMultiplier()).toBe(1.2);
    expect(sector._seats.length).toBe(7);
  });

  test('renderSector should append sector and seat elements to #seats', () => {
    document.body.innerHTML = `
      <button id="lang-toggle">中文</button>
      <div id="seat-booking-app"><div id="seats"></div></div>
    `;
    const sector = new Sector('V', 1.0, 1, 1);
    sector.renderSector();
    const sectorDiv = document.getElementById('s-V');
    expect(sectorDiv).not.toBeNull();
    const rows = sectorDiv.querySelectorAll('.row');
    expect(rows.length).toBe(2);
    const seats = sectorDiv.querySelectorAll('.seat');
    expect(seats.length).toBe(2);
  });

  test('renderSector should throw error if app container is missing', () => {
    document.body.innerHTML = '<div id="seats"></div>';
    const sector = new Sector('X', 1.0, 1);
    expect(() => sector.renderSector()).toThrow('App container not found');
  });

  test('renderSector should throw error if seats container is missing', () => {
    document.body.innerHTML = '<div id="seat-booking-app"></div>';
    const sector = new Sector('Y', 1.0, 1);
    expect(() => sector.renderSector()).toThrow('Seats container not found');
  });
});

// --------------------------------------------------
// Utility functions tests
// --------------------------------------------------
describe('Utility functions', () => {
  test('localStorageSpace should log current storage usage', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.setItem('testKey', 'some value');
    localStorageSpace();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Current local storage:'));
    spy.mockRestore();
  });

  test('localStorageSpace should log empty storage when no data', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
    localStorageSpace();
    expect(spy).toHaveBeenCalledWith('Empty (0 KB)');
    expect(spy).toHaveBeenCalledWith('5 MB');
    spy.mockRestore();
  });

  test('cacheServices should throw error when localStorage is not available', () => {
    const originalStorage = global.Storage;
    global.Storage = undefined;
    const app2 = new SeatBookingApp('test2');
    const service = new Service('A', 10);
    app2.addService(service);
    window.alert = jest.fn();
    expect(() => {
      app2.cacheServices();
    }).toThrow('Access to localStorage in this browser is not available. Data cannot be saved.');
    expect(window.alert).toHaveBeenCalled();
    global.Storage = originalStorage;
  });

  test('renderBookedSeats should not crash when no current service', () => {
    const services = showingRoom1.getServicesArray().slice();
    showingRoom1.getServicesArray().length = 0;
    showingRoom1.setCurrentServiceId('');
    expect(() => renderBookedSeats()).not.toThrow();
    services.forEach(s => showingRoom1.addService(s));
  });

  test('renderBookedSeats should mark booked seats correctly', () => {
    const service = new Service('MarkTest', 10);
    showingRoom1.addService(service);
    showingRoom1.renderServicesList();
    document.body.innerHTML = `
      <button id="lang-toggle">中文</button>
      <main id="seat-booking-app">
        <select id="services-list"></select>
        <input id="service-name" />
        <input id="service-price" />
        <ul id="sectors-list"></ul>
        <ul id="order-details"></ul>
        <span id="order-total-price"></span>
        <button id="book-seats-btn">Buy</button>
        <div id="seats">
          <div id="s-A1">
            <div id="s-A1-1">
              <div id="s-A1-1-1" class="seat"></div>
            </div>
          </div>
        </div>
      </main>
    `;
    service.setBookedSeatsArray(['s-A1-1-1']);
    renderBookedSeats();
    const seat = document.getElementById('s-A1-1-1');
    expect(seat.classList.contains('seat--booked')).toBe(true);
    showingRoom1.getServicesArray().pop();
  });
});

// --------------------------------------------------
// Event listener tests
// --------------------------------------------------
describe('Event listeners', () => {
  function loadModuleWithFullDOM() {
    localStorage.clear();
    let mod;
    jest.isolateModules(() => {
      document.body.innerHTML = `
        <button id="lang-toggle">中文</button>
        <main id="seat-booking-app">
          <div id="settings" class="settings">
            <div class="services-list">
              <label for="services-list">Choose a service:</label>
              <select name="services-list" id="services-list"></select>
              <label for="service-name">Movie title:</label>
              <input type="text" name="service-name" id="service-name">
              <label for="service-price">Price base:</label>
              <input type="number" name="service-price" id="service-price" min="0" max="100" step="0.01">
              <div class="services-list__btns">
                <button id="service-add-btn" class="btn">Add new</button>
                <button id="service-update-btn" class="btn">Save changes</button>
                <button id="service-delete-btn" class="btn">Delete</button>
              </div>
            </div>
            <div class="sectors">
              <button id="sectors-price-btn" class="btn">Edit sectors prices</button>
              <h3>Price multipliers for each sector:</h3>
              <ul id="sectors-list" class="sectors__list"></ul>
              <button id="sectors-save-btn" class="btn">Save</button>
            </div>
            <div id="order" class="order">
              <div class="order__header"><h2>Tickets:</h2></div>
              <div class="order__main"><ul id="order-details"></ul></div>
              <div id="order-footer" class="order__footer">
                <span id="order-total-price"></span>
                <button id="book-seats-btn" class="btn">Buy</button>
              </div>
            </div>
          </div>
          <div id="screening-room-1">
            <div id="screen">Screen</div>
            <div id="seats"></div>
          </div>
        </main>
      `;
      mod = require('../script/seat-booking-app');
    });
    return mod;
  }

  test('clicking a seat should toggle seat--reserved class', () => {
    const mod = loadModuleWithFullDOM();
    const service = new mod.Service('Test', 10);
    mod.showingRoom1.addService(service);
    mod.showingRoom1.renderServicesList();
    const seat = document.querySelector('.seat');
    expect(seat).not.toBeNull();
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(true);
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(false);
  });

  test('changing service dropdown should update current service', () => {
    const mod = loadModuleWithFullDOM();
    const s1 = new mod.Service('Movie A', 12);
    const s2 = new mod.Service('Movie B', 15);
    mod.showingRoom1.addService(s1);
    mod.showingRoom1.addService(s2);
    mod.showingRoom1.renderServicesList();
    const dropdown = document.getElementById('services-list');
    dropdown.value = s2.getId();
    dropdown.dispatchEvent(new Event('change'));
    expect(mod.showingRoom1.getCurrentServiceId()).toBe(s2.getId());
  });

  test('add service button should create a new service', () => {
    const mod = loadModuleWithFullDOM();
    document.getElementById('service-name').value = 'New Film';
    document.getElementById('service-price').value = '25';
    document.getElementById('service-add-btn').click();
    const services = mod.showingRoom1.getServicesArray();
    expect(services.length).toBeGreaterThan(0);
    expect(services[services.length - 1].getName()).toBe('New Film');
  });

  test('update service button should modify current service', () => {
    const mod = loadModuleWithFullDOM();
    const service = new mod.Service('Old', 10);
    mod.showingRoom1.addService(service);
    mod.showingRoom1.renderServicesList();
    mod.showingRoom1.setCurrentServiceId(service.getId());
    document.getElementById('service-update-btn').disabled = false;
    document.getElementById('service-name').value = 'Updated';
    document.getElementById('service-price').value = '20';
    document.getElementById('service-update-btn').click();
    expect(service.getName()).toBe('Updated');
    expect(service.getPrice()).toBe('20');
  });

  test('delete service button should remove current service', () => {
    const mod = loadModuleWithFullDOM();
    const s1 = new mod.Service('ToDelete', 10);
    mod.showingRoom1.addService(s1);
    mod.showingRoom1.renderServicesList();
    mod.showingRoom1.setCurrentServiceId(s1.getId());
    document.getElementById('service-delete-btn').disabled = false;
    const initialCount = mod.showingRoom1.getServicesArray().length;
    document.getElementById('service-delete-btn').click();
    expect(mod.showingRoom1.getServicesArray().length).toBe(initialCount - 1);
  });

  test('book seats button should move reserved seats to booked', () => {
    const mod = loadModuleWithFullDOM();
    const service = new mod.Service('Show', 20);
    mod.showingRoom1.addService(service);
    mod.showingRoom1.renderServicesList();
    mod.showingRoom1.setCurrentServiceId(service.getId());
    document.getElementById('book-seats-btn').disabled = false;
    const seat = document.querySelector('.seat');
    seat.classList.add('seat--reserved');
    service._seatsReserved = [seat.id];
    document.getElementById('book-seats-btn').click();
    expect(service.getBookedSeats()).toContain(seat.id);
    expect(seat.classList.contains('seat--booked')).toBe(true);
  });

  test('clicking a seat should not toggle if no current service', () => {
    const mod = loadModuleWithFullDOM();
    mod.showingRoom1.setCurrentServiceId('');
    const seat = document.querySelector('.seat');
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(false);
  });

  test('clicking a seat should not toggle if seat is booked', () => {
    const mod = loadModuleWithFullDOM();
    const service = new mod.Service('Test', 10);
    mod.showingRoom1.addService(service);
    mod.showingRoom1.renderServicesList();
    const seat = document.querySelector('.seat');
    seat.classList.add('seat--booked');
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(false);
  });

  test('update service button should do nothing if no current service', () => {
    const mod = loadModuleWithFullDOM();
    mod.showingRoom1.setCurrentServiceId('');
    document.getElementById('service-update-btn').disabled = false;
    expect(() => document.getElementById('service-update-btn').click()).not.toThrow();
  });

  test('delete service button should do nothing if no current service', () => {
    const mod = loadModuleWithFullDOM();
    mod.showingRoom1.setCurrentServiceId('');
    document.getElementById('service-delete-btn').disabled = false;
    expect(() => document.getElementById('service-delete-btn').click()).not.toThrow();
  });

  test('book seats button should do nothing if no current service', () => {
    const mod = loadModuleWithFullDOM();
    mod.showingRoom1.setCurrentServiceId('');
    document.getElementById('book-seats-btn').disabled = false;
    expect(() => document.getElementById('book-seats-btn').click()).not.toThrow();
  });
});

// --------------------------------------------------
// Additional branch coverage tests
// --------------------------------------------------
describe('Branch coverage boosters', () => {
  test('fetchServices should handle invalid JSON gracefully', () => {
    localStorage.setItem('sba-services-testRoom', 'not-valid-json');
    console.warn = jest.fn();
    app.fetchServices();
    expect(app.getServicesArray()).toHaveLength(0);
    expect(app.getCurrentServiceId()).toBe('');
    console.warn.mockRestore();
  });

  test('fetchServices should handle non-array JSON', () => {
    localStorage.setItem('sba-services-testRoom', JSON.stringify({ not: 'array' }));
    app.fetchServices();
    expect(app.getServicesArray()).toHaveLength(0);
    expect(app.getCurrentServiceId()).toBe('');
  });

  test('localStorageSpace should handle keys with hasOwnProperty false', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const originalToString = window.localStorage.toString;
    window.localStorage.toString = 'fake';
    localStorageSpace();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Current'));
    window.localStorage.toString = originalToString;
    spy.mockRestore();
  });

  test('markBookedSeats should only add class to booked seats', () => {
    document.body.innerHTML = `
      <div id="seat-1" class="seat"></div>
      <div id="seat-2" class="seat"></div>
    `;
    const service = new Service('Test', 10);
    service.setBookedSeatsArray(['seat-1']);
    service.markBookedSeats();
    expect(document.getElementById('seat-1').classList.contains('seat--booked')).toBe(true);
    expect(document.getElementById('seat-2').classList.contains('seat--booked')).toBe(false);
  });
});