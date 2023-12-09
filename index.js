import { ApolloServer, UserInputError, gql } from 'apollo-server';
import { v1 as uuid } from 'uuid'
import axios from 'axios';

const persons = [
    {
        "name": "Aaron",
        "phone": "66654130",
        "street": "Dr Aiguader",
        "city": "Barcelona",
        "id": "1"
    },
    {
        "name": "Becky",
        "phone": "78904512",
        "street": "5th Ave",
        "city": "New York",
        "id": "2"
    },
    {
        "name": "Carol",
        "phone": "98765432",
        "street": "Baker St",
        "city": "London",
        "id": "3"
    },
    {
        "name": "David",
        "phone": "66554321",
        "street": "6th St",
        "city": "Chicago",
        "id": "4"
    },
    {
        "name": "Emily",
        "phone": "45678901",
        "street": "Main St",
        "city": "Boston",
        "id": "5"
    },
    {
        "name": "Frank",
        "phone": "33332111",
        "street": "Market St",
        "city": "Philadelphia",
        "id": "6"
    }
]

// Describe the data and querys
const typeDefinitions = gql`

    enum YesNo {
        YES
        NO
    }

    type Address {
        street: String!
        city: String!
    }    

     type Person {
        name: String!
        phone: String
        address: Address!
        city: String!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPerson(name: String!): Person
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person

        editNumber(
            name: String!
            phone: String
        ): Person
    }
`;

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const {data: personsFromRestAPI} = await axios.get('http://localhost:3000/persons')
            console.log(personsFromRestAPI)

            if (args.phone === "YES") return personsFromRestAPI

            return personsFromRestAPI
                .filter(person => {
                    return args.phone === "YES" ? person.phone : !person.phone
                })
        },
        findPerson: (root, args) => {
            const { name } = args
            return persons.find(person => person.name === name)
        },
    },
    Mutation: {
        addPerson: (root, args) => {
            // Verify that fields are not duplicated and handle errors with ApolloServer - UserInputError
            if (persons.find(p => p.name === args.name)) {
                throw new UserInputError('Person already exists', {
                    invalidArgs: args.name
                })
            }
            const person = { ...args, id: uuid() }
            persons.push(person) // update database with new person 
            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)
            if (personIndex === -1) return null

            const person = persons[personIndex]
            const updatedPerson = {...person, phone: args.phone}
            persons[personIndex] = updatedPerson

            return updatedPerson
        }
    },
    Person: {
        address: (root) => {
            return {
                street: root.street,
                city: root.city,
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs: typeDefinitions,
    resolvers
})

// Server
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at: ${url}`)
})

