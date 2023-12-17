import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const apolloClient = new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
        //uri: 'http://localhost:4000/rickmorty',
        uri: 'https://mms-graph.doctorew.com/rickmorty',
    }),
    cache: new InMemoryCache(),
});
