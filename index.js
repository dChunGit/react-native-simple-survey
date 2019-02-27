import React, { Component } from 'react';
import {
    View,
    ViewPropTypes,
} from 'react-native';
import PropTypes from 'prop-types';

import SelectionGroup, { SelectionHandler } from 'react-native-selection-group';

export class SimpleSurvey extends Component {
    static propTypes = {
        survey: PropTypes.arrayOf(
            PropTypes.shape({
                questionType: PropTypes.string.isRequired,
                questionText: PropTypes.string,
                questionId: PropTypes.string,
                options: PropTypes.arrayOf(PropTypes.shape({
                    optionText: PropTypes.string.isRequired,
                    value: PropTypes.any.isRequired,
                }))
            }).isRequired
        ).isRequired,
        onAnswerSubmitted: PropTypes.func,
        onSurveyFinished: PropTypes.func,
        renderSelector: PropTypes.func,
        renderTextInput: PropTypes.func,
        selectionGroupContainerStyle: ViewPropTypes.style,
        containerStyle: ViewPropTypes.style,
        renderPrev: PropTypes.func,
        renderNext: PropTypes.func,
        renderFinished: PropTypes.func,
        renderInfo: PropTypes.func,
    };

    /** survey needs to be
     * [
     *     {
     *         questionType: string
     *         questionText: string
     *         questionId: string
     *         options: [
     *             { optionText : string, value : any }
     *             ...
     *         ]
     *     }
     *     ...
     * ]
     */

    constructor(props) {
        super(props);
        this.state = { currentQuestionIndex: 0, answers: [] };
        this.updateAnswer.bind(this);
        this.selectionHandlers = [];
        for (let i = 0; i < this.props.survey.length; i++) {
            this.selectionHandlers[i] = new SelectionHandler();
        }
    }

    updateAnswer(answerForCurrentQuestion) {
        const { answers } = this.state;
        answers[this.state.currentQuestionIndex] = answerForCurrentQuestion;
        this.setState({ answers });
    }

    renderPreviousButton() {
        let { currentQuestionIndex } = this.state;
        return (
            this.props.renderPrevious(() => {
                currentQuestionIndex--;
                this.setState({ currentQuestionIndex });
            }, (currentQuestionIndex !== 0)
            ));
    }

    renderFinishOrNextButton() {
        const { answers } = this.state;
        const { survey } = this.props;
        let { currentQuestionIndex } = this.state;

        const enabled = (
                (Boolean(answers[currentQuestionIndex]) && answers[currentQuestionIndex].value) ||
                (survey[currentQuestionIndex].questionType === 'Info')
            );
        
        if (currentQuestionIndex === this.props.survey.length - 1) {
            return (
                this.props.renderFinished(() => {
                    if (this.props.onAnswerSubmitted && answers[currentQuestionIndex]) {
                        this.props.onAnswerSubmitted(answers[currentQuestionIndex]);
                    }
                    if (this.props.onSurveyFinished) {
                        // Remove empty answers, coming from info screens.
                        const filteredAnswers = answers.filter(n => n);
                        this.props.onSurveyFinished(filteredAnswers);
                    }
                }, enabled));
        }

        return (
            this.props.renderNext(() => {
                if (this.props.onAnswerSubmitted && answers[currentQuestionIndex]) {
                    this.props.onAnswerSubmitted(answers[currentQuestionIndex]);
                }
                currentQuestionIndex++;
                this.setState({ currentQuestionIndex });
            }, enabled)
        );
    }

    renderNavButtons() {
        const { navButtonContainerStyle } = this.props;
        return (
            <View style={navButtonContainerStyle}>
                {this.renderPreviousButton()}
                {this.renderFinishOrNextButton()}
            </View>
        );
    }

    renderSelectionGroup() {
        const { survey, renderSelector, selectionGroupContainerStyle, containerStyle } = this.props;
        const { currentQuestionIndex } = this.state;

        return (
            <View style={containerStyle}>
                {this.props.renderQuestionText ?
                    this.props.renderQuestionText(this.props.survey[currentQuestionIndex].questionText) : null}
                <SelectionGroup
                    onPress={this.selectionHandlers[currentQuestionIndex].selectionHandler}
                    items={survey[currentQuestionIndex].options}
                    isSelected={this.selectionHandlers[currentQuestionIndex].isSelected}
                    renderContent={renderSelector}
                    containerStyle={selectionGroupContainerStyle}
                    onItemSelected={(item) => this.updateAnswer({
                        questionId: survey[currentQuestionIndex].questionId,
                        value: item
                    })}
                />
                {this.renderNavButtons()}
            </View>
        );
    }

    renderNumeric() {
        const { survey, renderNumericInput, containerStyle } = this.props;
        const currentQuestionIndex = this.state.currentQuestionIndex;
        const answers = this.state.answers;
        const { questionText, questionId } = survey[currentQuestionIndex];

        return (
            <View style={containerStyle}>
                {this.props.renderQuestionText ?
                    this.props.renderQuestionText(questionText) : null}
                {renderNumericInput(
                    (value) => {
                        const valInt = parseInt(value, 10);
                        if (Number.isInteger(valInt)) {
                            this.updateAnswer({
                                questionId,
                                value: valInt
                            });
                        } else if (value === '') {
                            this.updateAnswer({
                                questionId,
                                value: ''
                            });
                        }
                    },
                    answers[currentQuestionIndex] === undefined ? '' : answers[currentQuestionIndex].value
                )}
                {this.renderNavButtons()}
            </View>
        );
    }

    renderTextInputElement() {
        const { survey, renderTextInput, containerStyle } = this.props;
        const currentQuestionIndex = this.state.currentQuestionIndex;
        const answers = this.state.answers;
        const { questionText, questionId, placeholderText = null } = survey[currentQuestionIndex];

        return (<View style={containerStyle}>
            {this.props.renderQuestionText ?
                this.props.renderQuestionText(questionText) : null}
            {renderTextInput((value) =>
                this.updateAnswer({
                    questionId,
                    value
                }),
                placeholderText,
                answers[currentQuestionIndex] === undefined ? undefined : answers[currentQuestionIndex].value,
            )}
            {this.renderNavButtons()}
        </View>
        );
    }

    renderInfo() {
        const currentQuestionIndex = this.state.currentQuestionIndex;
        const { survey, renderInfo, containerStyle } = this.props;
        const { questionText } = survey[currentQuestionIndex];
        

        return (<View style={containerStyle}>
            {renderInfo(questionText)}
            {this.renderNavButtons()}
        </View>
        );
    }

    render() {
        const { survey } = this.props;
        const currentQuestion = this.state.currentQuestionIndex;
        switch (survey[currentQuestion].questionType) {
            case 'SelectionGroup': return this.renderSelectionGroup();
            case 'TextInput': return this.renderTextInputElement();
            case 'NumericInput': return this.renderNumeric();
            case 'Info': return this.renderInfo();
            default: return <View />;
        }
    }
}
