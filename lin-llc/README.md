# lin-llc Project

## Overview
This project is a web application designed for managing orders and quotes. It allows users to create, view, and manage both orders and quotes efficiently.

## Project Structure
```
lin-llc
├── src
│   ├── app
│   │   └── owner
│   │       └── quotes
│   │           ├── [quote]
│   │           │   └── page.tsx
│   │           ├── add
│   │           │   └── page.tsx
│   │           ├── layout.tsx
│   │           └── page.tsx
│   └── modules
│       └── shared
│           └── interfaces
│               └── navigation
│                   └── side
│                       └── quote-nav.tsx
└── README.md
```

## Features

### Quotes Management
- **Quotes List Page**: Displays a list of all quotes fetched from Firestore. Users can view and edit each quote.
- **Add Quote Page**: Provides a form for users to create new quotes, including fields for client information and quote details.
- **Quote Detail Page**: Displays detailed information about a specific quote and allows for editing.
- **Layout**: Defines the layout for the quotes section, including side navigation.
- **Side Navigation**: Facilitates navigation between the quotes list and the add quote page.

## Technologies Used
- **React**: For building the user interface.
- **Next.js**: For server-side rendering and routing.
- **Firebase**: For database management and real-time data fetching.

## Getting Started
1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up Firebase configuration in the project.
4. Run the application using `npm run dev`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.