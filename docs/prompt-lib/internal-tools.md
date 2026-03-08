### API analyzer

Create a tool for analyzing apis of a project. The tool should be able to:
```
1. Automatically discover and document all API endpoints in a given backend or full-stack application using openAPI specifications.
2. Provide usage analyzis of APIs in a given application(ex: in a react application) by analyzing the codebase and identifying which API endpoints are being called, how frequently they are used, and in which components or modules they are utilized.
3. Search and filter API endpoints based on various criteria such as endpoint name, HTTP method, response status codes, and usage frequency.
4. Sort API endpoints based on different parameters like usage frequency, response time, or alphabetical order, used or unused, and more.
5. Generate interactive API documentation that allows developers to test endpoints directly from the documentation interface. That should include features like sending test requests, viewing response data, and understanding request/response structures. Also it should give option to fully customize the request (headers, body, query parameters, etc.) and see the response in a formatted way.
6. Tool's input will be as follow:
   - API provider source: The tool should accept the source of the APIs to analyze, which could be a path to a codebase of a application like springboot, node.js etc. or a openAPI specification file.
   - API consumer source: The tool should also accept the source of the API consumer codebase, which could be a path to a frontend application like react, angular etc. or any other codebase that consumes the APIs.

7. Tool should developer friendly and easy to use, with clear documentation on how to set it up and run the analysis. It should also provide options for customizing the analysis parameters and output formats.
8. Tool UI modern and follow modern design principles, with light and dark themes, responsive design, and intuitive navigation. The UI should be designed to provide a seamless user experience, allowing developers to easily access and understand the API analysis results.
```



### Database viewer

```
Create a database viewer tool that allows users to visualize and interact with their database schemas. The goal is to provide an intuitive interface for developers to work with databases which will mostly work as a internal developer tool. The tool should be scalable, maintainable, long term support which will developed in a way that open source collaboration is possible and user friendly. The tool will be developed with the aim of supporting multiple database types (e.g., MySQL, PostgreSQL, MongoDB, more as needed), but for now it is enough to support postgresql. The tool should provide features such as,
- Schema visualization: Display database schemas in a clear and organized manner, allowing users to easily understand the structure of their databases.
- Data viewer: Allow users to view and interact with the data stored in their databases, including features like filtering, sorting, and pagination.
- Query builder: Provide a user-friendly interface for constructing and executing SQL queries without needing to write raw SQL code.
- Database management: Offer features for managing database connections, including adding, editing, and deleting connections, as well as testing connectivity.
- More features can be added as needed, but the above features are the core functionalities that the tool should provide. The tool should be designed with a focus on usability and performance, ensuring that it can handle large databases efficiently while providing a seamless user experience.
The tool should be developed using modern web technologies (e.g., React, Node.js) and should be designed to be easily extensible to support additional database types in the future. The codebase should be well-documented and structured to facilitate open source collaboration, allowing other developers to contribute to the project and enhance its features over time.
```