import {
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Select,
  Dropdown, DropdownItem, createTheme, ThemeProvider, Spinner
} from "flowbite-react";
import {COUNTRIES, COUNTRY_CODE_TO_COUNTRY, SERVER_URL} from "./constants.jsx";
import {FlagIcon} from "./FlagIcon.jsx";
import {useState} from "react";
import axios from "axios";


const DropdownTheme = createTheme({
  // content: "py-1 focus:outline-none ",
  //add masHeight for dropdown list
  "content": "py-1 focus:outline-none overflow-y-auto max-h-64"
});

const FlagItem = ({country}) => <>
  <FlagIcon code={country.code}/>
  <span style={{paddingLeft: "0.5rem"}}>{country.name}</span>
</>

export function SignupModal({show, close, onSuccess}) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("");

  const submitForm = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await axios.post(SERVER_URL + 'togglePresence', {name,flag,date: show.date})
      onSuccess(show.date,result.data)
      close()
    } catch (e) {

    } finally {
      setIsLoading(false)
    }
  }

  return (
      <Modal show={show} onClose={close} size="md">
        <form onSubmit={submitForm}>
        <ModalHeader>When do you plan to play</ModalHeader>
        <ModalBody>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email1">Time and day</Label>
            </div>
            <TextInput type="text" readOnly value={show && `${show.day} at ${show.hour}h${show.easternHour}`}/>
          </div>
          <div>
            <div className="mb-2 mt-2 block">
              <Label htmlFor="email1">Your player name</Label>
            </div>
            <TextInput
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-2 mt-2 block">
              <Label htmlFor="password1">Flag</Label>
            </div>
            <Dropdown
              renderTrigger={(e) => <Button color="alternative" fullSized>{flag
                ? <FlagItem country={COUNTRY_CODE_TO_COUNTRY[flag]}/>
                : "Country Flag"
              }</Button>} placement="bottom" theme={DropdownTheme}
            >
              {COUNTRIES.map(country =>
                <DropdownItem key={country.id} onClick={() => setFlag(country.code)}>
                  <FlagItem country={country}/>
                </DropdownItem>
              )}
            </Dropdown>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit">
            {isLoading && <Spinner size="sm" aria-label="Info spinner example" className="me-3" light />}
            Submit</Button>
          <span className="text-gray-500 text-sm"> (will be saved for next time)</span>
        </ModalFooter>
        </form>
      </Modal>

  );
}
