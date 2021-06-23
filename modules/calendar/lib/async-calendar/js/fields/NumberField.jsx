export default function NumberField(props) {
    const editField = () => {
        return (
            <input type="number" value={props.value}/>
        )
    }

    const viewField = () => {
        const className = props.value === 0 ? 'publishpress-calendar-empty-value' : '';

        return (
            <span className={className}>{props.value}</span>
        );
    }

    return props.isEditing ? editField() : viewField();
}
