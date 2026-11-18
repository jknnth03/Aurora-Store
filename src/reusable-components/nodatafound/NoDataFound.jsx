import Lottie from "lottie-react";
import NoDataAnimation from "../../assets/NoDataFound.json";
import "./NoDataFound.scss";
import "./NoDataFoundMessage.scss";

const NoDataFound = ({
  animationData = NoDataAnimation,
  animationSize,
  title,
  message,
}) => {
  const hasText = Boolean(title || message);

  const animation = (
    <div
      className="no-data__animation"
      style={
        animationSize
          ? { width: animationSize, maxWidth: "100%", height: "auto" }
          : undefined
      }>
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );

  if (!hasText) {
    return <div className="no-data no-data--default">{animation}</div>;
  }

  return (
    <div className="no-data">
      <div className="no-data__content">
        {animation}
        <div className="no-data__text">
          {title && <p className="no-data__title">{title}</p>}
          {message && <p className="no-data__message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default NoDataFound;
