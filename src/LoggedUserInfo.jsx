import {getJwtUser} from "./utils.jsx";
import {FlagIcon} from "./FlagIcon.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import {COUNTRIES, COUNTRY_CODE_TO_COUNTRY, SERVER_URL} from "./constants.jsx";
import {
  Button,
  Dropdown,
  DropdownItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader, Spinner,
  TextInput
} from "flowbite-react";
import {FlagField, NameField} from "./SignupModal.jsx";

export const LoggedUserInfo = ({onSuccess}) => {
  const user = getJwtUser()
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [flag, setFlag] = useState(user.flag);
  const [editDialog,setEditDialog] = useState()
  useEffect(() => {
    setName(user.name)
    setFlag(user.flag)
  }, [user.name,user.flag]);
  const submitForm = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await axios.post(SERVER_URL + 'updatePlayer', {jwt: localStorage.getItem("jwt"),name,flag})
      localStorage.setItem("jwt", result.data.jwt)
      setEditDialog(false)
      onSuccess()
    } catch (e) {
    } finally {
      setIsLoading(false)
    }
  }



  return <div>
    You will appear as: <span
    onClick={() => setEditDialog(true)}
    style={{display:'inline-block',borderRadius:'4px',backgroundColor:"#DDD",padding:'4px','cursor':'pointer'}}
  >
    <FlagIcon code={user.flag} />{user.name}
    <a style={{color:'#5490ea',fontSize:'12px'}}>(Edit)</a>
  </span>

      <Modal show={editDialog} onClose={() => setEditDialog(false)} size="md">
        <form onSubmit={submitForm}>
          <ModalHeader>Update player info</ModalHeader>
          <ModalBody>
            <NameField name={name} setName={setName} />
            <FlagField code={flag} setCode={setFlag} />
          </ModalBody>
          <ModalFooter>
            <Button type="submit">
              {isLoading && <Spinner size="sm" aria-label="Info spinner example" className="me-3" light />}
              Submit</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
}