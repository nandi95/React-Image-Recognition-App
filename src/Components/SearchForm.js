import React from 'react';
import PropTypes from "prop-types";

const Searchform = (props) => {

    return (
        <div className="search-form">
            {props.loading ?
                <div className="container">
                    <div className="📦"></div>
                    <div className="📦"></div>
                    <div className="📦"></div>
                    <div className="📦"></div>
                    <div className="📦"></div>
                </div>
                :
                <span></span>}
            <form autoComplete="on" id="form" onSubmit={props.performSearch}>

                <input placeholder='Try something like "forest"' name="input" id="search-bar" type="text"/>
                <button className="search-button" form="form"></button>
            </form>
            <p className="description">This app automatically recognises the subjects and themes in the picture. You can
                paste in a url, upload your image, search for something or leave the field empty for a random picture.
                See the top 10 key concepts related to the pictures and decide how the app did.</p>
            <div className="buttons-container">
                <button onClick={() => {
                    props.increaseScore("Wrong")
                }} className="wrong">Wrong
                </button>
                <button onClick={() => {
                    props.increaseScore("Correct")
                }} className="correct">Correct
                </button>
            </div>
            <a href="https://github.com/nandi95/React-Image-Recognition-App" class="git-link">Github repo</a>
        </div>
    );
};

Searchform.propTypes = {
    increaseScore: PropTypes.func.isRequired,
    performSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default Searchform;
