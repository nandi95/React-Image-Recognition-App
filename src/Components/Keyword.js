import React from 'react';
import PropTypes from "prop-types";

class Keyword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isHover: false,
            name: props.name,
            value: (props.value * 100).toFixed(2),
            errorPage: props.errorPage,
            votedOn: false,
            status: null,
            id: props.id,
        }
    }

    vote = (status) => {
        if (!this.state.votedOn || this.state.status !== status) {
            this.setState({
                votedOn: true,
                status: status
            });
            this.props.keywordVote(status, true, this.state.id);
        }
        if (this.state.status === status) {
            this.setState({
                votedOn: false,
                status: null
            });
            this.props.keywordVote(null, false, this.state.id);
        }
    };

    render() {
        return (
            <div
                className={`keyword
            ${this.state.status === 1 ? " vote-correct" : ""}
            ${this.state.status === 0 ? " vote-wrong" : ""}
        `}
                onMouseEnter={() => {
                    this.setState({isHover: true})
                }}
                onMouseLeave={() => {
                    this.setState({isHover: false})
                }}
            >
                <span
                    id={"keyword"}
                >{this.state.name}&nbsp;-&nbsp;{this.state.value}%
                    {!this.state.errorPage && this.state.isHover
                        ?
                        <div className="vote-icons">
                            <span className="fas fa-check" onClick={() => {
                                this.vote(1)
                            }}></span>
                            <span className="fas fa-times" onClick={() => {
                                this.vote(0)
                            }}></span>
                        </div>
                        :
                        null}
                </span>

            </div>);
    }
}

Keyword.propTypes = {
    name: PropTypes.node.isRequired,
    value: PropTypes.number.isRequired,
    errorPage: PropTypes.bool.isRequired,
    keywordVote: PropTypes.func,
    id: PropTypes.string.isRequired,
    status: PropTypes.number,
    votedOn: PropTypes.bool,
};

export default Keyword;
