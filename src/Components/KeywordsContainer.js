import React from 'react';
import PropTypes from "prop-types";
import Keyword from "./Keyword";

const KeywordsContainer = props => {
    return (<div className="keywords-container">
        {props.concepts.map((concept) => {
            return (<Keyword
                key={concept.id}
                id={concept.id}
                name={concept.name}
                value={concept.value}
                errorPage={props.errorPage}
                keywordVote={props.keywordVote}
            />)
        })}
    </div>);
};
KeywordsContainer.propTypes = {
    concepts: PropTypes.array.isRequired,
    errorPage: PropTypes.bool.isRequired,
    keywordVote: PropTypes.func.isRequired,
};
export default KeywordsContainer;
