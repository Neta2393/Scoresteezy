import { useState, useEffect } from "react";
import { Container, Col, Form, Button, Card, Row } from "react-bootstrap";

import Auth from "../utils/auth";
import { savePokemonIds, getSavedPokemonIds } from "../utils/localStorage";
import { useMutation } from "@apollo/client";
import { SAVE_POKEMON } from "../utils/mutations";

const SearchPokemon = () => {
  // create state for holding returned google api data
  const [searchedPokemon, setSearchedPokemon] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState("");

  // create state to hold saved bookId values
  const [savedPokemonIds, setSavedPokemonIds] = useState(getSavedPokemonIds());

  const [savePokemon] = useMutation(SAVE_POKEMON);
  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    return () => savePokemonIds(savedPokemonIds);
  });

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:${searchInput}&page=1&pageSize=25`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error("something went wrong!");
      }

      const pokemonData = result.data.map((pokemonCard) => ({
        name: pokemonCard.name || ["No name to display"],
        pokedex: pokemonCard.nationalPokedexNumbers,
        image: pokemonCard.images.small,
        price: pokemonCard.cardmarket
          ? pokemonCard.cardmarket.prices.averageSellPrice
          : 0,
      }));
      console.log(pokemonData);
      setSearchedPokemon(pokemonData);
      setSearchInput("");
    } catch (error) {
      console.error(error);
    }
  };

  // create function to handle saving a book to our database
  const handleSavePokemon = async (pokemonId) => {
    // find the book in `searchedBooks` state by the matching id
    const pokemonToSave = searchedPokemon.find(
      (pokemon) => pokemon.pokemonId === pokemonId
    );

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const response = await savePokemon({
        variables: {
          pokemonData: pokemonToSave,
        },
      });

      if (!response) {
        throw new Error("something went wrong!");
      }

      // if pokemon successfully saves to user's account, save pokemon id to state
      setSavedPokemonIds([...savedPokemonIds, pokemonToSave.pokemonId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for pokemon!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a pokemon"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {searchedPokemon.length
            ? `Viewing ${searchedPokemon.length} results:`
            : "Search for a pokemon to begin"}
        </h2>
        <Row>
          {searchedPokemon.map((pokemon) => {
            return (
              <Col md="4" key={pokemon.pokemonId}>
                <Card border="dark">
                  {pokemon.image ? (
                    <Card.Img
                      src={pokemon.image}
                      alt={`The cover for ${pokemon.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{pokemon.title}</Card.Title>
                    <p className="small">Pokemon: {pokemon.name}</p>
                    <Card.Text>{pokemon.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedPokemonIds?.some(
                          (savedPokemonId) =>
                            savedPokemonId === pokemon.pokemonId
                        )}
                        className="btn-block btn-info"
                        onClick={() => handleSavePokemon(pokemon.pokemonId)}
                      >
                        {savedPokemonIds?.some(
                          (savedPokemonId) =>
                            savedPokemonId === pokemon.pokemonId
                        )
                          ? "This pokemon has already been saved!"
                          : "Save this pokemon!"}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchPokemon;
