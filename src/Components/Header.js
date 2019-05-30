import React from 'react';
import PropTypes from "prop-types";
import Counter from "./Counter";
import {NavLink} from "react-router-dom";

const Header = props => {

    return (
        <header>
            <Counter counter={props.counter}/>
            <div className="padding"></div>
            <div className="tab"><NavLink to="/history">History</NavLink></div>
        </header>
    );
};
Header.propTypes = {
    counter: PropTypes.object.isRequired,
};


export default Header;
