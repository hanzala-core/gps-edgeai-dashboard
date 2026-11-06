# GPS–EdgeAI Monitoring Dashboard

An academic prototype planned to demonstrate a GPS monitoring dashboard, backend interaction, and persistent session data.

## Project status

Repository initialized. The application has not been implemented yet.

The initial prototype will use **simulated GPS data** and clearly display **Simulation Mode**. It will not connect to a physical GPS receiver or run a trained AI model at this stage. Simulated classifications must not be presented as real AI inference.

## Initial scope

- Dashboard with receiver status and Start/Stop session controls.
- Simulated satellite readings and position, velocity, and time (PVT) outputs.
- Simulated classifications: Stable, Degraded, and Anomalous.
- Charts, alerts, and session logs.
- Backend APIs for session control and simulated data handling.
- SQLite database for saving and retrieving sessions, readings, and classification logs.

## Planned application structure

```text
Dashboard interface
       |
Backend / API
       |
SQLite database
```

The frontend and backend frameworks will be selected during implementation. Setup and run instructions will be added when the application is available.

## Development milestones

1. Define the interface and database schema.
2. Implement session controls and simulated GPS readings.
3. Connect the dashboard to the backend and SQLite database.
4. Add charts, classifications, alerts, and saved-session retrieval.
5. Verify the demonstration workflow and document how to run it.

## Data handling

Use synthetic demonstration data for the academic prototype. Keep credentials, local databases, and any non-public project material out of version control.

## Future integration

Real receiver data and trained AI integration are later work. They are outside the first academic prototype milestone.
