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