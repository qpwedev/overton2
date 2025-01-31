import "./InputForm.css"
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import useAppModel from "../../hooks/useMainReducer";
import { AppReducerActionTypeEnum } from "../../state/mainReducer";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from '../../firebase.config';
import { useNavigate } from "react-router-dom";
import { useTonhubConnect } from "react-ton-x";
import axios from "axios";


export type InputFormProps = {
    inputFields: any
    setModal?: any,
}



const InputForm = ({ inputFields, setModal }: InputFormProps) => {
    const connect = useTonhubConnect();
    const { appModel, dispatch } = useAppModel();

    const [pending, setPending] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const onSubmit = async (formData: any) => {
        setPending(true);
        document.body.style.overflow = 'unset';
        const tonData = JSON.parse(localStorage.getItem("connection") || "")
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
        const rightDate = mm + '/' + dd + '/' + yyyy;
        if (inputFields.type === "submitQuestion") {
            const questionsCollection = collection(db, "questions");
            if (tonData) {
                try {
                    // const owner = connect.state.
                    const response: any = await axios({
                        method: 'post',
                        url: "http://104.248.100.22:3000/deploy",
                        data: {
                            owner: tonData.walletConfig.address,
                        }
                    });
                    const responseData = response.data
                    const reqTrans = await connect.api.requestTransaction({
                        to: responseData.contractAddress,
                        value: (formData.rewardAmount * 1e9).toString(),
                        stateInit: responseData.stateInit,
                        text: "Smart contract deployment",
                        payload: responseData.payload
                    })

                    if (reqTrans.type !== 'success') return;

                    await addDoc(questionsCollection, {
                        userID: tonData.walletConfig.address,
                        title: formData.questionTitle,
                        questionText: formData.questionDescription,
                        rewardAmount: formData.rewardAmount,
                        date: rightDate,
                        questionContractAddress: responseData.contractAddress
                    });
                } catch (error) {
                    console.error(error);
                }
            }


            window.location.reload()

        } else if (inputFields.type === "submitAnswer") {
            const answersCollection = collection(db, "answers");
            const tonData = JSON.parse(localStorage.getItem("connection") || "")
            if (tonData) {
                try {
                    const reqTrans = await connect.api.requestTransaction({
                        to: appModel.currQuestion.contractAddress,
                        value: (0.001 * 1e9).toString(),
                        text: appModel.currQuestion.title.splice(15),
                    })
                } catch (error) {
                    console.error(error);
                }
            }
            try {
                await addDoc(answersCollection, {
                    // @ts-ignore
                    userID: connect.state.walletConfig.address,
                    questionID: appModel.currQuestion.contractAddress,
                    answer: formData.answer,
                    date: rightDate,
                    answered: false
                });

            } catch (error) {
                console.log(error)
            }

            setModal(false)
        }
        setPending(false);
    };

    if (inputFields.type === "submitQuestion") {
        return (
            <div className='FormWrapper'>
                <form className="addQuestionForm" onSubmit={handleSubmit(onSubmit)}>
                    <input placeholder="Title" className="questionTitleInput" defaultValue="" {...register(inputFields.questionTitle)} />
                    <input placeholder="Reward 💎" className="questionAmountInput" defaultValue="" {...register(inputFields.rewardAmount)} />
                    <textarea placeholder="Description" className="questionBodyInput" defaultValue="" {...register(inputFields.questionDescription)} />
                    {errors.exampleRequired && <span>This field is required</span>}
                    {pending && <div style={{ fontSize: "2rem" }}>Confirm transaction on Tonhub</div>}
                    <input className="questionSubmitBtn" type="submit" />
                </form>
            </div>
        );
    } else {
        return (
            <div className='FormWrapper'>
                <form className="addQuestionForm" onSubmit={handleSubmit(onSubmit)}>
                    <textarea placeholder="answer" className="questionBodyInput" defaultValue="" {...register(inputFields.answer)} />
                    {errors.exampleRequired && <span>This field is required</span>}
                    <p>Confirm transaction on Tonhub</p>
                    <input className="questionSubmitBtn" type="submit" />
                </form>
            </div>
        );
    }

}

export default InputForm;