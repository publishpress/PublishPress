import Select from "../Select";

export default function AuthorsField(props) {
    const editField = () => {
        return (
            <Select
                ajaxUrl={props.ajaxUrl}
                nonce={props.nonce}
                ajaxAction={'publishpress_calendar_search_authors'}
                value={props.value}
                name={props.name}
                onSelect={props.onSelect}
                onClear={props.onClear}/>
        )
    }

    const viewField = () => {
        return (
            <span>{props.value.join(', ')}</span>
        );
    }

    return props.isEditing ? editField() : viewField();
}