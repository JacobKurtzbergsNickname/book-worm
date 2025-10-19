import {type JSX, useEffect} from "react";
import axios from "axios";

function Books(): JSX.Element {
    // const [books, setBooks] = useState<string>()
    useEffect(() => {
        axios.get("http://localhost:5012/api/books")
            .then(r => console.log(r.data))
    }, []);
    return (
        <section className="text-center border-1 mt-5 mx-10">
            Books
        </section>
    )
}

export default Books;