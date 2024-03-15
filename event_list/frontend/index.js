const eventsAPI = (function () {
    const API_URL = "http://localhost:3000/events";
  
    async function getEvents() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Fetching events failed:', error);
      }
    }
  
    async function addEvent(newEvent) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEvent),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Adding event failed:', error);
      }
    }
  
    async function deleteEvent(id) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Deleting event failed:', error);
      }
    }
  
    async function editEvent(id, updatedEvent) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedEvent),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Editing event failed:', error);
      }
    }
  
    return {
      getEvents,
      addEvent,
      deleteEvent,
      editEvent,
    };
  })();

class EventsView{
    constructor() {
        this.addEventButton = document.getElementById('add-event-btn');
        this.eventsBody = document.getElementById('events-body');
        this.addEventButton.addEventListener('click', this.renderAddEventForm);
    }

    renderAddEventForm = () => {
        // 渲染一个新的空白行供用户输入数据
        const row = this.eventsBody.insertRow();
        row.innerHTML = `
            <td><input type="text" id="event-name" placeholder="Event Name"></td>
            <td><input type="date" id="event-start"></td>
            <td><input type="date" id="event-end"></td>
            <td>
                <button id="save-event-btn" class="save-btn">+</button>
                <button class="cancel-btn">×</button>
            </td>
        `;

        const saveBtn = row.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.handleSaveEvent(row));
        const cancelBtn = row.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.handleCancelEvent(row));
    };

    handleSaveEvent = async (row) => {
        const nameInput = row.querySelector('#event-name').value.trim();
        const startInput = row.querySelector('#event-start').value;
        const endInput = row.querySelector('#event-end').value;

        if (!nameInput || !startInput || !endInput) {
            alert('Please fill in all fields.');
            return;
        }

        const newEvent = {
            name: nameInput,
            start: startInput,
            end: endInput
        };

        await this.handler(newEvent);

        this.renderEvents(this.events);
    }

    setHandler(handler) {
        this.handler = handler;
    }

    handleCancelEvent = (row) => {
        row.remove();
    };

    renderEvents(events) {
        this.events = events; 
        this.eventsBody.innerHTML = '';
        events.forEach((event) => {
            const row = this.eventsBody.insertRow();
            row.setAttribute("id", event.id)
            row.innerHTML = `
                <td>${event.eventName}</td>
                <td>${event.startDate}</td>
                <td>${event.endDate}</td>
                <td>
                    <button class="edit-btn" data-id="${event.id}">✎</button>
                    <button class="delete-btn" data-id="${event.id}">✕</button>
                </td>
            `;
        });
    }

    removeEventElem(id) {
        document.getElementById(id).remove();
    }
}
class EventsModel {
    constructor() {
        this.events = []; 
    }

    async init() {
        try {
            const events = await eventsAPI.getEvents();
            this.setEvents(events);
        } catch (error) {
            console.error('Failed to initialize events:', error);
        }
    }

    setEvents(events) {
        this.events = events;
    }

    addEvent(newEvent) {
        this.events.push(newEvent);
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
    }

    editEvent(eventId, updatedEvent) {
        const index = this.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...updatedEvent };
        }
    }

    getEventById(eventId) {
        return this.events.find(event => event.id === Number(eventId)) || null;
    }
}
class EventsController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.view.setHandler(this.handleAddEvent);
        this.init();
    }

    init = async () => {
        await this.model.init();
        const events = await this.getEvents();
        this.view.renderEvents(events);
        this.handleDeleteEvent();
        this.handleEditEvent();
    }

    getEvents = async () => {
        try {
            return await eventsAPI.getEvents();
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }

    handleAddEvent = async (newEvent) => {
        try {
            const createdEvent = await eventsAPI.addEvent({
                eventName: newEvent.name,
                startDate: newEvent.start,
                endDate: newEvent.end
            });
            if (createdEvent) {
                const events = await this.getEvents();
                this.model.addEvent(createdEvent)
                this.view.renderEvents(events);
            }
        } catch (error) {
            console.error('Failed to add event:', error);
        }
    }

    handleDeleteEvent() {
        //event delegation
        this.view.eventsBody.addEventListener("click", async (e) => {
          const elem = e.target;
          if (elem.classList.contains("delete-btn")) {
            console.log('delete')
            const eventElem = elem.parentElement.parentElement;
            const deleteId = eventElem.id;
            await eventsAPI.deleteEvent(deleteId);
            this.view.removeEventElem(deleteId);
          }
        });
    }

    handleEditEvent = () => {
        this.view.eventsBody.addEventListener("click", async (e) => {
            const elem = e.target;
    
            if (elem.classList.contains("edit-btn")) {
                console.log('edit')
                const eventElem = elem.closest('tr');
                const editId = eventElem.getAttribute('id');
                console.log(editId)
                console.log(this.model.events)
                const event = this.model.getEventById(editId);
                console.log(event)
                if (event) {
                    console.log('event', event);
                    eventElem.innerHTML = `
                        <td><input type="text" value="${event.eventName}" class="edit-event-name"></td>
                        <td><input type="date" value="${event.startDate}" class="edit-event-start"></td>
                        <td><input type="date" value="${event.endDate}" class="edit-event-end"></td>
                        <td>
                            <button class="save-edit-btn" data-id="${event.id}">✓</button>
                            <button class="cancel-edit-btn" data-id="${event.id}">×</button>
                        </td>
                    `;
                }
            }
    
            // 保存
            else if (elem.classList.contains("save-edit-btn")) {
                const editId = elem.getAttribute('data-id');
                const row = elem.closest('tr');
                const updatedEvent = {
                    eventName: row.querySelector('.edit-event-name').value,
                    startDate: row.querySelector('.edit-event-start').value,
                    endDate: row.querySelector('.edit-event-end').value,
                };
    
                // APi EDIT
                try {
                    await eventsAPI.editEvent(editId, updatedEvent);
                    await this.init();
                } catch (error) {
                    console.error('Failed to save edited event:', error);
                }
            }
    
            // 取消
            else if (elem.classList.contains("cancel-edit-btn")) {
                const editId = elem.getAttribute('data-id');
                await this.init();
            }
        });
    }
    
}

const eventsView = new EventsView();
const eventsModel = new EventsModel();
const eventsControler = new EventsController(eventsModel, eventsView );