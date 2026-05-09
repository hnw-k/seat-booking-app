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