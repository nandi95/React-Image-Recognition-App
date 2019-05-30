import React from 'react';
import PropTypes from "prop-types";

const Counter = props => {
    return (
        <div className="counter">
            <h3>Correct: {props.counter.Correct}</h3>
            <h3>Wrong: {props.counter.Wrong}</h3>
        </div>
    );
};
Counter.propTypes = {
    counter: PropTypes.object.isRequired
};

export default Counter;
